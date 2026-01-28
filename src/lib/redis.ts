import Redis from "ioredis";

const redisClient = () => {
    if (process.env.REDIS_URL) {
        return new Redis(process.env.REDIS_URL);
    }
    console.warn("REDIS_URL not found, falling back to local port 6379");
    return new Redis({
        host: "localhost",
        port: 6379,
    });
};

export const redis = redisClient();
