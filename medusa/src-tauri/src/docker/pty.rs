// use anyhow::Result;
// use std::{
//     sync::{Arc, Mutex},
//     vec,
// };

// use bollard::{
//     exec::{CreateExecOptions, StartExecOptions},
//     Docker,
// };
// use futures_util::StreamExt;
// use portable_pty::{native_pty_system, CommandBuilder, PtySize};
// use tokio::{io::AsyncWriteExt, sync::mpsc};

// pub struct AgentPtySession {
//     inner: Arc<Mutex<AgentPtySessionInner>>,
// }

// pub struct AgentPtySessionInner {
//     /// The exec id docker gave us
//     exec_id: String,
//     /// The portable-pty master (host side)
//     master: Box<dyn portable_pty::MasterPty + Send>,
//     /// The child process handle (so we can afford signals)
//     _child: Box<dyn portable_pty::Child>,
//     /// Channel that the UI will read from (terminal output)
//     output_tx: mpsc::UnboundedSender<Vec<u8>>,
//     /// Channel the UI writes to (user input)
//     input_rx: mpsc::UnboundedReceiver<Vec<u8>>,
//     docker: Docker,
//     container_id: String,
// }

// impl AgentPtySession {
//     pub async fn open(docker: Docker, container_id: &str) -> Result<Self> {
//         let exec = docker
//             .create_exec(
//                 container_id,
//                 CreateExecOptions {
//                     cmd: Some(vec!["/bin/bash".to_string()]),
//                     attach_stdin: Some(true),
//                     attach_stdout: Some(true),
//                     attach_stderr: Some(true),
//                     tty: Some(true),
//                     env: Some(vec!["TERM=xterm-256color".to_string()]),
//                     ..Default::default()
//                 },
//             )
//             .await?
//             .id;

//         let pty_system = native_pty_system();
//         let pair = pty_system.openpty(PtySize {
//             rows: 24,
//             cols: 80,
//             pixel_width: 0,
//             pixel_height: 0,
//         })?;

//         let mut master_writer = pair.master.take_writer()?;
//         let mut master_reader = pair.master.try_clone_reader()?;

//         let hijack = match docker
//             .start_exec(
//                 &exec,
//                 Some(StartExecOptions {
//                     detach: false,
//                     tty: true,
//                     ..Default::default()
//                 }),
//             )
//             .await?
//         {
//             bollard::exec::StartExecResults::Attached { output, input } => (output, input),
//             _ => anyhow::bail!("exec did not attach"),
//         };

//         let (output_tx, _output_rx) = mpsc::unbounded_channel();
//         let (_input_tx, input_rx) = mpsc::unbounded_channel();

//         // Docker → PTY master (output to UI)
//         let out_tx = output_tx.clone();
//         let mut output_stream = hijack.0;
//         tokio::spawn(async move {
//             while let Some(item) = output_stream.next().await {
//                 match item {
//                     Ok(bollard::container::LogOutput::StdOut { message })
//                     | Ok(bollard::container::LogOutput::StdErr { message }) => {
//                         let _ = master_writer.write_all(&message);
//                         let _ = out_tx.send(message.to_vec());
//                     }
//                     _ => {}
//                 }
//             }
//         });

//         // PTY Slave -> Docker Stdin (input)
//         let mut docker_input = hijack.1;
//         tokio::spawn(async move {
//             let mut buf = [0u8; 4096];
//             loop {
//                 match master_reader.read(&mut buf) {
//                     Ok(0) => break,
//                     Ok(n) => {
//                         if docker_input.write_all(&buf[..n]).await.is_err() {
//                             break;
//                         }
//                     }
//                     Err(_) => break,
//                 }
//             }
//             let _ = docker_input.shutdown().await;
//         });

//         let inner = AgentPtySessionInner {
//             exec_id: exec,
//             master: pair.master,
//             _child: pair.slave.spawn_command(CommandBuilder::new("/bin/bash"))?,
//             output_tx,
//             input_rx,
//             docker,
//             container_id: container_id.to_string(),
//         };

//         Ok(Self {
//             inner: Arc::new(Mutex::new(inner)),
//         })
//     }

//     pub fn resize(&self, rows: u16, cols: u16) -> Result<()> {
//         let inner = self.inner.lock().unwrap();
//         inner.master.resize(PtySize {
//             rows,
//             cols,
//             pixel_width: 0,
//             pixel_height: 0,
//         })?;

//         // Tell Docker too
//         let _ = inner.docker.resize_exec(
//             &inner.exec_id,
//             bollard::exec::ResizeExecOptions {
//                 height: rows,
//                 width: cols,
//             },
//         );
//         Ok(())
//     }

//     pub fn write(&self, data: &[u8]) -> Result<()> {
//         let inner = self.inner.lock().unwrap();
//         let mut writer = inner.master.take_writer()?;
//         writer.write_all(data)?;
//         writer.flush()?;
//         Ok(())
//     }

//     pub fn output_stream(&self) -> mpsc::UnboundedReceiver<Vec<u8>> {
//         let inner = self.inner.lock().unwrap();
//         inner.output_tx
//     }
// }
