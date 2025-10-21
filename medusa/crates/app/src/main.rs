use gpui::*;
use medusa_app::state::app::AppState;

fn main() {
    Application::new().run(|cx: &mut App| {
        let bounds = Bounds::centered(None, size(px(1200.0), px(800.0)), cx);

        cx.open_window(WindowOptions {
            window_bounds: Some(WindowBounds::Windowed(bounds)),
            titlebar: Some(TitlebarOptions { 
                title: Some("Medusa".into()), 
                appears_transparent: false, 
                traffic_light_position: None 
            }),
            window_min_size: Some(size(px(800.0), px(600.0))),
            kind: WindowKind::Normal,
            ..Default::default()
        }, |_, cx| {
            cx.new(|cx| AppState::new(cx))
        })
        .unwrap();
    });
}