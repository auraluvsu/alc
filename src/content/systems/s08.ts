import type { Module } from '../types'

export const s08: Module = {
  n: 8,
  title: 'Processes & Signals',
  tour: '8 · Exceptional Control Flow',
  summary: 'Control flow the program didn\'t write: exceptions in the hardware sense, system calls and errno, processes created with fork and exec, waiting for children, signals and how to handle them safely, and shutting down a long-running service cleanly.',
  topics: ['Exceptional control flow', 'System calls & errno', 'fork, exec & wait', 'Signals', 'Graceful shutdown'],
  cpp23: ['`std::jthread` and `std::stop_token` (C++20) give threads a cooperative cancellation channel.', '`posix_spawn` is usually preferable to fork + exec in large processes.'],
  lessons: [
    {
      id: 'ecf',
      title: 'Exceptional control flow',
      blocks: [
        { kind: 'analogy', text: "Your program thinks it runs from top to bottom, but it's constantly interrupted, like a cashier tapped on the shoulder: a timer says another process's turn has come, a network card says a packet arrived, the program divides by zero, or it asks the kernel for something (a system call). Each interruption jumps into the kernel, which handles it and usually returns as if nothing happened." },
        { kind: 'list', items: [
          '**Interrupts**: from hardware (timer, network card, disk). Asynchronous; the program never notices unless it measures time.',
          '**Traps**: deliberate, such as system calls (`read`, `write`, `mmap`). A trip into the kernel costs from roughly a hundred nanoseconds to microseconds.',
          '**Faults**: possibly recoverable errors, such as a page fault (module 9). Fixed and retried, or turned into a signal (`SIGSEGV`).',
          '**Aborts**: unrecoverable hardware errors.',
          'C++ `throw` is a different, purely user-space mechanism, but it shares the idea of non-local jumps.',
        ] },
        { kind: 'check', q: 'A system call like read() is which kind of exceptional control flow?', options: ['Interrupt', 'Trap (intentional)', 'Abort', 'Fault'], answer: 1, hint: 'The program asked for it.', explain: 'The `syscall` instruction traps into the kernel.' },
      ],
    },
    {
      id: 'syscalls',
      title: 'System calls & errno',
      blocks: [
        { kind: 'analogy', text: "System calls are the kernel's service counter: open this file, send these bytes, give me more memory. Each one returns −1 on failure and leaves a reason code in `errno`, like a slip saying why the request was refused. Ignore the slip and your program carries on with nonsense." },
        { kind: 'code', code: `#include <cerrno>
#include <cstdio>
#include <cstring>
#include <fcntl.h>
#include <system_error>
#include <unistd.h>

int main() {
    int fd = open("/no/such/file", O_RDONLY);
    if (fd == -1) {
        int e = errno;                                  // copy it at once: later calls may overwrite it
        std::printf("open failed: %s (%d)\\n", std::strerror(e), e);   // No such file or directory (2)
        std::error_code ec(e, std::generic_category());
        std::printf("%s\\n", ec.message().c_str());
    }
    std::printf("pid %d, ppid %d\\n", getpid(), getppid());
}
// $ strace -c ./app      → count and time every system call a program makes
// $ strace -e trace=network -p <pid>    → watch a running process's socket calls` },
        { kind: 'pitfall', text: '`EINTR`: a slow system call (read, accept, sleep) can return −1 with errno EINTR when a signal arrives. Robust code retries in a loop. Partial results are the other trap: `write` may write fewer bytes than asked, so loop until everything is written.' },
        { kind: 'check', q: 'Why copy errno immediately after a failed call?', options: ['Style', 'Any later library call (even printf) may change it', 'It\'s thread-unsafe to read', 'It resets after 1 ms'], answer: 1, hint: 'A global-ish slip that anyone can overwrite.', explain: 'errno is thread-local, but per-thread calls still overwrite it.' },
      ],
    },
    {
      id: 'fork',
      title: 'fork, exec & wait',
      blocks: [
        { kind: 'analogy', text: "`fork` photocopies the running process: the copy (the child) continues from the same line, with the same memory, but `fork` returns 0 in the child and the child's ID in the parent so each knows which it is. `exec` then replaces the copy's program with a different one entirely. `wait` is the parent collecting the child's exit slip; uncollected children linger as zombies." },
        { kind: 'code', code: `#include <cstdio>
#include <sys/wait.h>
#include <unistd.h>

int main() {
    int counter = 100;
    pid_t pid = fork();
    if (pid == 0) {                                   // child
        counter += 1;                                 // changes the CHILD's copy only
        std::printf("child: counter=%d\\n", counter); // 101
        std::fflush(stdout);                          // exec discards unflushed stdio buffers!
        execlp("echo", "echo", "hello from echo", (char*)nullptr);   // replace the program
        _exit(127);                                   // only reached if exec failed
    }
    int status = 0;
    waitpid(pid, &status, 0);                         // reap the child
    std::printf("parent: counter=%d, child exit=%d\\n", counter, WEXITSTATUS(status));   // 100, 0
}
// Memory is copied lazily (copy-on-write, module 9), so fork is cheap even for large processes.
// Without the fflush, "child: counter=101" silently vanishes when stdout is a pipe or file:
// it was still sitting in the child's buffer when exec replaced the program.` },
        { kind: 'compare',
          python: `subprocess.run(["echo", "hi"], check=True)   # fork/exec/wait wrapped`,
          ts: `child_process.spawn("echo", ["hi"])   // Node: posix_spawn underneath`,
          go: `exec.Command("echo", "hi").Run()   // Go never exposes a raw fork`,
          java: `new ProcessBuilder("echo", "hi").start().waitFor();`,
          cpp: `fork(); execlp(...); waitpid(...);   // or posix_spawn`,
          note: 'Higher-level languages hide fork, partly because forking a multithreaded process is hazardous.' },
        { kind: 'check', q: 'After fork, the child increments a variable. What does the parent see?', options: ['The new value', 'Its own unchanged copy', 'A segfault', 'Random'], answer: 1, hint: 'A photocopy.', explain: 'Separate address spaces; share via pipes, sockets or shared memory.' },
      ],
    },
    {
      id: 'signals',
      title: 'Signals',
      blocks: [
        { kind: 'analogy', text: "A signal is a tap on the process's shoulder from the kernel or another process: SIGINT (Ctrl-C), SIGTERM (please stop), SIGSEGV (bad memory access), SIGCHLD (a child finished). The handler interrupts whatever the program was doing, possibly halfway through a malloc, so it may only do a tiny set of async-signal-safe things. The usual pattern is: set a flag, return, and let the main loop act on it." },
        { kind: 'code', code: `#include <atomic>
#include <csignal>
#include <cstdio>
#include <unistd.h>

std::atomic<bool> stop_requested{false};          // lock-free atomic: safe to write in a handler

extern "C" void on_signal(int) { stop_requested.store(true, std::memory_order_relaxed); }

int main() {
    struct sigaction sa{};
    sa.sa_handler = on_signal;
    sigemptyset(&sa.sa_mask);
    sigaction(SIGINT, &sa, nullptr);               // Ctrl-C
    sigaction(SIGTERM, &sa, nullptr);              // kill / systemd stop

    raise(SIGTERM);                                // simulate: send ourselves SIGTERM
    while (!stop_requested.load()) { /* main loop: handle market data … */ }
    std::puts("flushing state, closing connections, exiting cleanly");
}
// Never call printf, malloc, locks or most library functions inside a signal handler.` },
        { kind: 'pitfall', text: 'SIGKILL (`kill -9`) and SIGSTOP can\'t be caught. A trading process killed with -9 gets no chance to cancel resting orders, which is why exchanges offer "cancel on disconnect" and why risk systems must never rely on the strategy process cleaning up after itself.' },
        { kind: 'check', q: 'What should a signal handler typically do?', options: ['Log extensively with printf', 'Set an atomic flag and return; the main loop reacts', 'Allocate memory', 'Lock a mutex'], answer: 1, hint: 'It may have interrupted malloc itself.', explain: 'Only async-signal-safe functions are allowed.' },
      ],
    },
    {
      id: 'shutdown',
      title: 'Graceful shutdown with jthread',
      blocks: [
        { kind: 'analogy', text: "A clean shutdown is a closing-time routine: stop taking new orders, finish the ones in progress, lock the till, then turn off the lights. In C++20, `std::jthread` hands each worker a `stop_token` (a closing-time bell it can check), and joins automatically when destroyed, so you can't forget to wait for it." },
        { kind: 'code', code: `#include <chrono>
#include <cstdio>
#include <thread>

void feed_handler(std::stop_token st) {
    long msgs = 0;
    while (!st.stop_requested()) {                  // check the bell every iteration
        ++msgs;                                     // … read and process one message …
        std::this_thread::sleep_for(std::chrono::milliseconds(1));
    }
    std::printf("feed handler stopping after %ld messages\\n", msgs);   // ≈ 50
}

int main() {
    std::jthread worker(feed_handler);              // passes a stop_token automatically
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    worker.request_stop();                          // ring the bell (e.g. from the SIGTERM flag)
}                                                   // ~jthread() joins: no orphaned thread
// Combine: signal handler sets an atomic flag → main thread calls request_stop() on workers.` },
        { kind: 'check', q: 'What does std::jthread do that std::thread doesn\'t?', options: ['Runs faster', 'Joins automatically on destruction and supports cooperative stop requests', 'Uses green threads', 'Ignores signals'], answer: 1, hint: 'j for joining.', explain: 'A std::thread destroyed while joinable calls std::terminate.' },
      ],
    },
  ],
  quiz: [
    { q: 'A page fault is a…', options: ['Trap', 'Fault (possibly recoverable)', 'Signal from another process', 'C++ exception'], answer: 1, explain: 'Module 9.' },
    { q: 'On failure, most POSIX calls return…', options: ['0', '-1 and set errno', 'An exception', 'nullptr always'], answer: 1, explain: 'Check every return.' },
    { q: 'EINTR means…', options: ['Invalid argument', 'The call was interrupted by a signal; retry', 'Out of memory', 'Permission denied'], answer: 1, explain: 'Loop on EINTR.' },
    { q: 'fork() returns 0 in…', options: ['The parent', 'The child', 'Both', 'Neither'], answer: 1, explain: 'The parent gets the child\'s pid.' },
    { q: 'exec…', options: ['Creates a new process', 'Replaces the current process\'s program', 'Waits for a child', 'Sends a signal'], answer: 1, explain: 'fork then exec.' },
    { q: 'A zombie process is…', options: ['Running wild', 'A finished child whose exit status hasn\'t been collected', 'A frozen process', 'A daemon'], answer: 1, explain: 'Reap with wait/waitpid.' },
    { q: 'Which signal can\'t be caught?', options: ['SIGTERM', 'SIGINT', 'SIGKILL', 'SIGCHLD'], answer: 2, explain: 'Nor SIGSTOP.' },
    { q: 'std::stop_token provides…', options: ['Preemptive thread killing', 'Cooperative cancellation the thread checks', 'Signal handling', 'Mutexes'], answer: 1, explain: 'With jthread.' },
  ],
}
