# Bugs

- [ ] The Subscriber type is `type Subscriber = () => void;` It takes no arguments. The subscribe callback doesn't receive the new value.
      The docs `example count.subscribe((value) => { ... })` is misleading; the callback actually receives nothing.
