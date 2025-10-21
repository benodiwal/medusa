use gpui::{AnyView, AppContext, Context, Entity, Render};
use crate::app::AppState;

pub trait Screen: Render + 'static {
    fn id(&self) -> &'static str;
    fn on_enter(&mut self, _cx: &mut Context<Self>) where Self: Sized {}
    fn on_exit(&mut self, _cx: &mut Context<Self>) where Self: Sized {}
}

pub struct Navigator {
    stack: Vec<AnyView>,
    history: Vec<&'static str>,
}

impl Navigator {
    pub fn new() -> Self {
        Self {
            stack: Vec::new(),
            history: Vec::new(),
        }
    }
    
    pub fn push<S: Screen>(&mut self, screen: S, cx: &mut Context<AppState>) {
        let screen_id = screen.id();
        let entity: Entity<S> = cx.new(|_| screen);
        self.stack.push(entity.into());
        self.history.push(screen_id);
        cx.notify();
    }
    
    pub fn pop(&mut self, cx: &mut Context<AppState>) -> bool {
        if self.stack.len() > 1 {
            self.stack.pop();
            self.history.pop();
            cx.notify();
            true
        } else {
            false
        }
    }
    
    pub fn replace<S: Screen>(&mut self, screen: S, cx: &mut Context<AppState>) {
        self.stack.pop();
        self.history.pop();
        self.push(screen, cx);
    }
    
    pub fn current(&self) -> Option<&AnyView> {
        self.stack.last()
    }
    
    pub fn history(&self) -> &[&'static str] {
        &self.history
    }
    
    pub fn clear_and_push<S: Screen>(&mut self, screen: S, cx: &mut Context<AppState>) {
        self.stack.clear();
        self.history.clear();
        self.push(screen, cx);
    }
    
    pub fn can_go_back(&self) -> bool {
        self.stack.len() > 1
    }
}