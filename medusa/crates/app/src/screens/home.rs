use gpui::{div, px, rgb, Context, Entity, InteractiveElement, MouseButton, MouseDownEvent, ParentElement, Render, Styled};
use crate::navigator::Screen;
use crate::app::AppState;
use crate::loading::LoadingScreen;

pub struct HomeScreen {
    app_state: Entity<AppState>,
}

impl HomeScreen {
    pub fn new(app_state: Entity<AppState>) -> Self {
        Self { app_state }
    }
    
    fn go_to_loading(&self, cx: &mut Context<Self>) {
        self.app_state.update(cx, |app, cx| {
            app.navigator().push(LoadingScreen::new(self.app_state.clone()), cx);
        });
    }
}

impl Screen for HomeScreen {
    fn id(&self) -> &'static str {
        "home"
    }
}

impl Render for HomeScreen {
    fn render(
        &mut self,
        _window: &mut gpui::Window,
        cx: &mut gpui::Context<Self>,
    ) -> impl gpui::IntoElement {
        div()
            .size_full()
            .flex()
            .flex_col()
            .items_center()
            .justify_center()
            .bg(rgb(0x1a1a1a))
            .gap_6()
            .child(
                div()
                    .text_size(px(32.0))
                    .font_weight(gpui::FontWeight::BOLD)
                    .text_color(rgb(0xc4a574))
                    .child("Welcome Home"),
            )
            .child(
                div()
                    .text_size(px(16.0))
                    .text_color(rgb(0x9a9a9a))
                    .child("You've successfully loaded Medusa!"),
            )
            .child(
                div()
                    .mt_4()
                    .px_6()
                    .py_3()
                    .bg(rgb(0xc4a574))
                    .text_color(rgb(0x1a1a1a))
                    .text_size(px(14.0))
                    .font_weight(gpui::FontWeight::SEMIBOLD)
                    .rounded(px(6.0))
                    .cursor_pointer()
                    .hover(|style| style.bg(rgb(0xd4b584)))
                    .on_mouse_down(MouseButton::Left, cx.listener(|this, _: &MouseDownEvent, _window, cx| {
                        this.go_to_loading(cx);
                    }))
                    .child("Back to Loading"),
            )
    }
}