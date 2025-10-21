use gpui::{div, rgb, IntoElement, ParentElement, Render, Styled};
use crate::{loading::LoadingScreen, navigator::Navigator};

pub struct AppState {
    navigator: Navigator,
}

impl AppState {
    pub fn new(cx: &mut gpui::Context<Self>) -> Self {
        let mut state = Self { 
            navigator: Navigator::new(),
        };
        
        let app = cx.entity();
        state.navigator.push(LoadingScreen::new(app), cx);
        
        state
    }
    
    pub fn navigator(&mut self) -> &mut Navigator {
        &mut self.navigator
    }
}

impl Render for AppState {
    fn render(&mut self, _window: &mut gpui::Window, _cx: &mut gpui::Context<Self>) -> impl gpui::IntoElement {
        div()
            .size_full()
            .bg(rgb(0x1a1a1a))
            .child(
                self.navigator
                    .current()
                    .map(|entity| entity.clone().into_any_element())
                    .unwrap_or_else(|| div().child("No screen").into_any_element())
            )
    }
}