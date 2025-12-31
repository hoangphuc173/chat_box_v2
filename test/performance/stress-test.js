import WebSocket from 'ws';
import { performance } from 'perf_hooks';

/**
 * Stress Test - Push the system to its limits
 */

const WS_URL = 'ws://localhost:8080';
const MAX_CONNECTIONS = 1000;
const MESSAGES_PER_CLIENT = 100;
const CONNECTION_DELAY = 10; // ms between connections

class StressTestClient {
    constructor(id) {
        this.id = id;
        this.ws = null;
        this.messagesSent = 0;
        this.messagesReceived = 0;
        this.startTime = null;
        this.endTime = null;
        this.errors = [];
    }

    async connect() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(WS_URL);
                this.startTime = performance.now();

                this.ws.on('open', () => {
                    console.log(`Client ${this.id} connected`);
                    this.login();
                    resolve();
                });

                this.ws.on('message', (data) => {
                    this.messagesReceived++;
                    try {
                        const msg = JSON.parse(data.toString());
                        if (msg.type === 'login_response' && msg.success) {
                            this.startSendingMessages();
                        }
                    } catch (e) {
                        this.errors.push({ type: 'parse_error', error: e.message });
                    }
                });

                this.ws.on('error', (error) => {
                    this.errors.push({ type: 'connection_error', error: error.message });
                    reject(error);
                });

                this.ws.on('close', () => {
                    this.endTime = performance.now();
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    login() {
        this.send({
            type: 'login',
            username: `stress_user_${this.id}`,
            password: 'stress123'
        });
    }

    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            this.messagesSent++;
            return true;
        }
        return false;
    }

    startSendingMessages() {
        let count = 0;
        const interval = setInterval(() => {
            if (count >= MESSAGES_PER_CLIENT) {
                clearInterval(interval);
                this.disconnect();
                return;
            }

            this.send({
                type: 'chat',
                content: `Stress test message ${count} from client ${this.id}`,
                roomId: 'global'
            });

            count++;
        }, 100);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }

    getStats() {
        return {
            id: this.id,
            messagesSent: this.messagesSent,
            messagesReceived: this.messagesReceived,
            duration: this.endTime ? (this.endTime - this.startTime) : null,
            errors: this.errors
        };
    }
}

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runStressTest() {
    console.log('🔥 Starting Stress Test...\n');
    console.log(`Target: ${WS_URL}`);
    console.log(`Max Connections: ${MAX_CONNECTIONS}`);
    console.log(`Messages Per Client: ${MESSAGES_PER_CLIENT}`);
    console.log('='.repeat(60));

    const clients = [];
    const startTime = performance.now();
    let successfulConnections = 0;
    let failedConnections = 0;

    // Phase 1: Establish connections
    console.log('\n📊 Phase 1: Establishing connections...\n');

    for (let i = 0; i < MAX_CONNECTIONS; i++) {
        const client = new StressTestClient(i);
        clients.push(client);

        try {
            await client.connect();
            successfulConnections++;

            if ((i + 1) % 100 === 0) {
                console.log(`✅ Connected: ${i + 1}/${MAX_CONNECTIONS} clients`);
            }
        } catch (error) {
            failedConnections++;
            console.error(`❌ Client ${i} failed to connect: ${error.message}`);
        }

        await wait(CONNECTION_DELAY);
    }

    console.log(`\n✅ Phase 1 Complete: ${successfulConnections} successful, ${failedConnections} failed`);

    // Phase 2: Message flood
    console.log('\n📊 Phase 2: Message flooding in progress...\n');

    // Wait for all clients to finish sending
    await wait(MESSAGES_PER_CLIENT * 100 + 5000);

    // Phase 3: Collect statistics
    console.log('\n📊 Phase 3: Collecting statistics...\n');

    const endTime = performance.now();
    const totalDuration = (endTime - startTime) / 1000; // seconds

    let totalMessagesSent = 0;
    let totalMessagesReceived = 0;
    let totalErrors = 0;

    clients.forEach(client => {
        const stats = client.getStats();
        totalMessagesSent += stats.messagesSent;
        totalMessagesReceived += stats.messagesReceived;
        totalErrors += stats.errors.length;
    });

    // Disconnect all clients
    console.log('🔌 Disconnecting all clients...\n');
    clients.forEach(client => client.disconnect());
    await wait(2000);

    // Print results
    console.log('='.repeat(60));
    console.log('📈 STRESS TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`\n🔗 Connections:`);
    console.log(`  Total Attempted: ${MAX_CONNECTIONS}`);
    console.log(`  Successful: ${successfulConnections}`);
    console.log(`  Failed: ${failedConnections}`);
    console.log(`  Success Rate: ${((successfulConnections / MAX_CONNECTIONS) * 100).toFixed(2)}%`);

    console.log(`\n💬 Messages:`);
    console.log(`  Total Sent: ${totalMessagesSent}`);
    console.log(`  Total Received: ${totalMessagesReceived}`);
    console.log(`  Messages/Second: ${(totalMessagesSent / totalDuration).toFixed(2)}`);

    console.log(`\n⏱️  Performance:`);
    console.log(`  Total Duration: ${totalDuration.toFixed(2)}s`);
    console.log(`  Avg Time/Client: ${(totalDuration / MAX_CONNECTIONS).toFixed(3)}s`);

    console.log(`\n❌ Errors:`);
    console.log(`  Total Errors: ${totalErrors}`);
    console.log(`  Error Rate: ${((totalErrors / totalMessagesSent) * 100).toFixed(2)}%`);

    // Performance verdict
    console.log(`\n🎯 Verdict:`);
    if (successfulConnections >= MAX_CONNECTIONS * 0.95 && totalErrors < totalMessagesSent * 0.01) {
        console.log(`  ✅ EXCELLENT - System handled ${MAX_CONNECTIONS} concurrent connections with < 1% error rate`);
    } else if (successfulConnections >= MAX_CONNECTIONS * 0.8 && totalErrors < totalMessagesSent * 0.05) {
        console.log(`  ⚠️  GOOD - System is stable but could be improved`);
    } else {
        console.log(`  ❌ NEEDS IMPROVEMENT - High failure or error rate detected`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🏁 Stress Test Complete!\n');

    process.exit(0);
}

// Memory usage tracking
function logMemoryUsage() {
    const used = process.memoryUsage();
    console.log(`\n💾 Memory Usage:`);
    console.log(`  RSS: ${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`);
    console.log(`  Heap Used: ${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`);
    console.log(`  Heap Total: ${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`);
}

// Track memory every 10 seconds
setInterval(logMemoryUsage, 10000);

// Run the stress test
runStressTest().catch(error => {
    console.error('💥 Stress test failed:', error);
    process.exit(1);
});
