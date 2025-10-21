use crate::app::AppState;
use crate::home::HomeScreen;
use crate::navigator::Screen;
use gpui::{
    div, px, rgb, Context, Div, Entity, FontWeight, ParentElement, Render, Styled,
};

pub struct LoadingScreen {
    progress: f32,
    app_state: Entity<AppState>,
}

impl LoadingScreen {
    pub fn new(app_state: Entity<AppState>) -> Self {
        Self {
            progress: 0.0,
            app_state,
        }
    }

    fn start_loading(&mut self, cx: &mut Context<Self>) {
        // Set progress to 100% immediately and navigate
        self.progress = 1.0;
        cx.notify();

        self.app_state.update(cx, |app, cx| {
            app.navigator().push(HomeScreen::new(self.app_state.clone()), cx);
        });
    }
}

impl Screen for LoadingScreen {
    fn id(&self) -> &'static str {
        "loading"
    }

    fn on_enter(&mut self, cx: &mut Context<Self>) {
        // Start the loading animation when screen enters
        self.start_loading(cx);
    }
}

impl Render for LoadingScreen {
    fn render(
        &mut self,
        _window: &mut gpui::Window,
        _cx: &mut gpui::Context<Self>,
    ) -> impl gpui::IntoElement {

        div()
            .size_full()
            .flex()
            .flex_col()
            .items_center()
            .justify_center()
            .bg(rgb(0x1a1a1a))
            .child(
                div()
                    .flex()
                    .flex_col()
                    .items_center()
                    .gap_6()
                    .child(
                        div()
                            .text_size(px(32.0))
                            .font_weight(FontWeight::BOLD)
                            .text_color(rgb(0xc4a574))
                            .child("Medusa"),
                    )
                    .child(self.render_progress_bar())
            )
    }
}

impl LoadingScreen {
    fn render_progress_bar(&self) -> Div {
        let progress_width = self.progress * 300.0;

        div().flex().flex_col().gap_2().child(
            div()
                .w(px(300.0))
                .h(px(8.0))
                .bg(rgb(0x2a2a2a))
                .rounded(px(4.0))
                .relative()
                .overflow_hidden()
                .child(
                    div()
                        .absolute()
                        .top_0()
                        .left_0()
                        .h_full()
                        .w(px(progress_width))
                        .bg(rgb(0xc4a574))
                        .rounded(px(4.0))
                        .child(
                            div()
                                .absolute()
                                .top_0()
                                .right_0()
                                .h_full()
                                .w(px(40.0))
                                .bg(rgb(0xd4b584)),
                        ),
                ),
        )
    }
}
