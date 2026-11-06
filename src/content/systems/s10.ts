import type { Module } from '../types'

export const s10: Module = {
  n: 10,
  title: 'System-Level I/O & Networking',
  tour: '10–11 · System-Level I/O · Network Programming',
  summary: 'Unix I/O through file descriptors, short reads and buffering, TCP and UDP sockets, framing messages on a byte stream, handling many connections with epoll, and the multicast UDP feeds exchanges use to publish market data.',
  topics: ['File descriptors', 'Short reads & buffering', 'TCP & UDP sockets', 'Framing messages', 'epoll & event loops', 'Multicast market data'],
  cpp23: ['Networking is still not in the C++ standard; Asio (standalone or Boost) is the de facto library. `io_uring` (Linux 5.1+) offers asynchronous I/O with fewer system calls.'],
  lessons: [
    {
      id: 'fds',
      title: 'File descriptors',
      blocks: [
        { kind: 'analogy', text: "On Unix almost everything is a file: regular files, pipes, terminals and network sockets are all opened and handed to you as a small integer, the file descriptor, like a cloakroom ticket. `read` and `write` work on any of them. 0, 1 and 2 are stdin, stdout and stderr; the next file you open usually gets 3." },
        { kind: 'code', code: `#include <cstdio>
#include <fcntl.h>
#include <unistd.h>

int main() {
    int fd = open("/tmp/fills.log", O_WRONLY | O_CREAT | O_APPEND, 0644);
    std::printf("fd = %d\\n", fd);                         // 3
    const char msg[] = "XAU,2,2385.1\\n";
    ssize_t n = write(fd, msg, sizeof(msg) - 1);           // raw system call, no buffering
    std::printf("wrote %zd bytes\\n", n);
    close(fd);                                             // always close: fds are a limited resource

    write(1, "straight to stdout\\n", 19);                 // fd 1 = stdout
}
// $ ls -l /proc/<pid>/fd      → every open descriptor of a running process
// $ ulimit -n                  → per-process limit (often 1024; raise it for servers)` },
        { kind: 'check', q: 'What are file descriptors 0, 1 and 2?', options: ['Disk partitions', 'stdin, stdout and stderr', 'The first three sockets', 'Kernel reserved'], answer: 1, hint: 'Open from birth.', explain: 'Shells redirect them with <, > and 2>.' },
      ],
    },
    {
      id: 'buffering',
      title: 'Short reads & buffering',
      blocks: [
        { kind: 'analogy', text: "`read(fd, buf, 4096)` means \"up to 4096 bytes\". On a socket you may get 1 byte or 4096, whatever has arrived. Code that assumes it got everything works perfectly in testing on localhost and breaks on a real network. Each `read`/`write` is also a system call, so writing one byte at a time is like posting each letter of a word in a separate envelope; buffered I/O (`FILE*`, `std::ofstream`) collects them first." },
        { kind: 'code', code: `#include <cerrno>
#include <unistd.h>

// Read exactly n bytes, or fail: handles short reads and EINTR
bool read_exact(int fd, void* buf, size_t n) {
    auto* p = static_cast<char*>(buf);
    while (n > 0) {
        ssize_t r = read(fd, p, n);
        if (r > 0) { p += r; n -= r; }
        else if (r == 0) return false;                 // EOF / peer closed
        else if (errno != EINTR) return false;         // real error
    }
    return true;
}

bool write_all(int fd, const void* buf, size_t n) {
    auto* p = static_cast<const char*>(buf);
    while (n > 0) {
        ssize_t w = write(fd, p, n);
        if (w > 0) { p += w; n -= w; }
        else if (errno != EINTR) return false;
    }
    return true;
}
// Buffered layers: stdio (FILE*), iostreams. std::endl FLUSHES (a syscall); '\\n' doesn't.`, lang: 'cpp' },
        { kind: 'pitfall', text: 'Logging with `std::endl` on every line forces a system call per line. In a hot loop that can dominate run time. Use `\'\\n\'` and let the buffer flush, or use an asynchronous logger that hands lines to a background thread.' },
        { kind: 'check', q: 'read() on a TCP socket asked for 100 bytes returns 37. What does that mean?', options: ['An error', '37 bytes were available; call read again for the rest', 'The connection closed', 'The message was truncated permanently'], answer: 1, hint: '"Up to" n bytes.', explain: '0 would mean the peer closed.' },
      ],
    },
    {
      id: 'sockets',
      title: 'TCP & UDP sockets',
      blocks: [
        { kind: 'analogy', text: "TCP is a phone call: you connect first, then everything you say arrives in order, without gaps, as one continuous stream; lost pieces are resent automatically. UDP is posting postcards: each one stands alone, may arrive out of order or not at all, but there's no call setup and no waiting for resends. Order entry uses TCP; market-data feeds often use UDP." },
        { kind: 'code', code: `#include <arpa/inet.h>
#include <cstdio>
#include <cstring>
#include <netinet/in.h>
#include <netinet/tcp.h>
#include <sys/socket.h>
#include <thread>
#include <unistd.h>

int main() {
    int srv = socket(AF_INET, SOCK_STREAM, 0);                   // TCP
    int one = 1;
    setsockopt(srv, SOL_SOCKET, SO_REUSEADDR, &one, sizeof one);
    sockaddr_in addr{}; addr.sin_family = AF_INET; addr.sin_port = htons(0);   // port 0: any free port
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    bind(srv, (sockaddr*)&addr, sizeof addr);
    listen(srv, 16);
    socklen_t len = sizeof addr; getsockname(srv, (sockaddr*)&addr, &len);

    std::thread client([port = addr.sin_port] {
        int c = socket(AF_INET, SOCK_STREAM, 0);
        int one = 1; setsockopt(c, IPPROTO_TCP, TCP_NODELAY, &one, sizeof one);   // no Nagle delay
        sockaddr_in a{}; a.sin_family = AF_INET; a.sin_port = port; a.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
        connect(c, (sockaddr*)&a, sizeof a);
        send(c, "NEW XAU 2 2385.1", 16, 0);
        close(c);
    });
    int conn = accept(srv, nullptr, nullptr);
    char buf[64]{}; ssize_t n = recv(conn, buf, sizeof buf - 1, 0);
    std::printf("server got %zd bytes: %s\\n", n, buf);
    client.join(); close(conn); close(srv);
}` },
        { kind: 'list', items: [
          '`htons`/`htonl` convert to network byte order (big-endian, module 1).',
          '`TCP_NODELAY` disables Nagle\'s algorithm, which otherwise holds back small packets for up to ~40 ms hoping to batch them: essential for order messages.',
          'TCP\'s reliability has a cost: a lost packet stalls everything behind it until it\'s resent (head-of-line blocking).',
        ] },
        { kind: 'check', q: 'Why set TCP_NODELAY on an order-entry connection?', options: ['Encryption', 'So small messages are sent immediately instead of being delayed for batching', 'To use UDP', 'To increase the buffer'], answer: 1, hint: 'Nagle\'s algorithm.', explain: 'Latency over bandwidth efficiency.' },
      ],
    },
    {
      id: 'framing',
      title: 'Framing messages',
      blocks: [
        { kind: 'analogy', text: "TCP delivers a river of bytes, not messages. Two sends can arrive as one read, and one send can arrive split across two. You must mark where each message ends: a length prefix (\"the next 38 bytes are one message\"), a delimiter (FIX uses SOH characters between fields and a checksum at the end), or fixed-size binary records." },
        { kind: 'code', code: `#include <cstdint>
#include <cstring>
#include <string>
#include <vector>

// Length-prefixed framing: [uint32 big-endian length][payload]
struct Framer {
    std::vector<char> buf;
    // Feed whatever bytes arrived; call on_msg for every complete message.
    template <class F> void feed(const char* data, size_t n, F&& on_msg) {
        buf.insert(buf.end(), data, data + n);
        size_t pos = 0;
        while (buf.size() - pos >= 4) {
            std::uint32_t len;
            std::memcpy(&len, buf.data() + pos, 4);
            len = __builtin_bswap32(len);                       // network → host order
            if (buf.size() - pos - 4 < len) break;              // incomplete: wait for more bytes
            on_msg(std::string_view(buf.data() + pos + 4, len));
            pos += 4 + len;
        }
        buf.erase(buf.begin(), buf.begin() + pos);              // keep any partial message
    }
};
// Real systems avoid the erase (use a ring buffer) and parse in place without copying.`, lang: 'cpp' },
        { kind: 'check', q: 'You send two 20-byte messages over TCP. The receiver\'s first read returns 27 bytes. Why?', options: ['Corruption', 'TCP is a byte stream: message boundaries aren\'t preserved', 'A UDP fallback', 'Nagle added bytes'], answer: 1, hint: 'A river, not parcels.', explain: 'Framing tells you where messages end.' },
      ],
    },
    {
      id: 'epoll',
      title: 'epoll & multicast market data',
      blocks: [
        { kind: 'analogy', text: "Blocking on one socket at a time is a waiter standing at one table until it orders. `epoll` is a buzzer system: register every table, and the kernel tells you exactly which ones are ready, so one thread can serve thousands of connections (this is what asyncio, Node and Go's runtime use underneath). Exchanges publish market data by UDP multicast: one stream of postcards copied by the network to every subscriber at once, with sequence numbers so you can detect any that went missing." },
        { kind: 'code', code: `#include <sys/epoll.h>
// Event loop skeleton
int ep = epoll_create1(0);
epoll_event ev{.events = EPOLLIN, .data = {.fd = sock}};
epoll_ctl(ep, EPOLL_CTL_ADD, sock, &ev);           // register interest once
epoll_event ready[64];
for (;;) {
    int n = epoll_wait(ep, ready, 64, -1);          // block until something is ready (or 0 to busy-poll)
    for (int i = 0; i < n; ++i) handle(ready[i].data.fd);   // non-blocking reads until EAGAIN
}

// Joining a multicast market-data group (UDP)
ip_mreq mreq{};
mreq.imr_multiaddr.s_addr = inet_addr("233.54.12.1");   // the feed's group address
mreq.imr_interface.s_addr = htonl(INADDR_ANY);
setsockopt(udp, IPPROTO_IP, IP_ADD_MEMBERSHIP, &mreq, sizeof mreq);
// Each packet carries a sequence number: a gap means packets were lost →
// request a retransmission or snapshot from the recovery feed (often TCP), and
// mark the book stale until it's rebuilt. Feeds are often published twice (A/B lines) for redundancy.`, lang: 'cpp', caption: 'epoll and multicast, the building blocks of feed handlers.' },
        { kind: 'list', items: [
          '`select` and `poll` re-scan every descriptor on each call (O(n)); `epoll` returns only the ready ones.',
          'Set sockets non-blocking (`O_NONBLOCK`) with epoll, and read until `EAGAIN`.',
          '`io_uring` batches submissions and completions through shared rings, cutting system calls further.',
          'The lowest-latency shops bypass the kernel entirely (module 12).',
        ] },
        { kind: 'check', q: 'How does a feed handler detect lost UDP market-data packets?', options: ['UDP resends them', 'Gaps in the packets\' sequence numbers', 'Checksums only', 'It can\'t'], answer: 1, hint: 'Postcards are numbered.', explain: 'Then recover from a snapshot or retransmission feed.' },
      ],
    },
  ],
  quiz: [
    { q: 'A file descriptor is…', options: ['A file name', 'A small integer handle for an open file, pipe or socket', 'A pointer', 'An inode'], answer: 1, explain: 'Close it when done.' },
    { q: 'read() returning 0 on a socket means…', options: ['No data yet', 'The peer closed the connection (EOF)', 'An error', 'Try again'], answer: 1, explain: '-1 with EAGAIN means no data yet (non-blocking).' },
    { q: 'std::endl…', options: ['Is the same as \'\\n\'', 'Writes a newline and flushes the stream', 'Closes the file', 'Is faster'], answer: 1, explain: 'Avoid in hot loops.' },
    { q: 'TCP guarantees…', options: ['Message boundaries', 'An ordered, reliable byte stream', 'Low latency always', 'Multicast'], answer: 1, explain: 'You must frame messages.' },
    { q: 'UDP is…', options: ['Connection-oriented', 'Connectionless datagrams that may be lost or reordered', 'Always reliable', 'Encrypted'], answer: 1, explain: 'Used for multicast feeds.' },
    { q: 'Nagle\'s algorithm…', options: ['Encrypts', 'Delays small packets to batch them', 'Prevents loss', 'Speeds connects'], answer: 1, explain: 'Disable with TCP_NODELAY.' },
    { q: 'epoll is preferred over select because…', options: ['It\'s portable', 'It reports only ready descriptors, scaling to many connections', 'It\'s synchronous', 'It needs no syscalls'], answer: 1, explain: 'O(ready) not O(n).' },
    { q: 'Market data is often published via…', options: ['HTTP', 'UDP multicast with sequence numbers', 'Email', 'TCP only'], answer: 1, explain: 'Plus recovery feeds.' },
  ],
}
