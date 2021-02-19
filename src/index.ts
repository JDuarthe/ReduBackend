import "reflect-metadata";
import { COOKIE_NAME, __prod__ } from "./constants";
import express from 'express'
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import Redis from "ioredis"
import session from "express-session"
import connectRedis from "connect-redis"
import { MyContex } from "./types";
import cors from "cors";
import { createConnection } from "typeorm";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import { Updoot } from "./entities/Updoot";
import path from "path";
import { createUserLoader } from "./utils/createUserLoader";
import { createUpdootLoader } from "./utils/createUpdootLoader";

const main = async () => {
    const conn = await createConnection({
        type: 'postgres',
        database: process.env.DATABASE_NAME,
        username: process.env.DATABASE_USERNAME,
        password: process.env.PASSWORD,
        logging: true,
        synchronize: true,
        migrations: [path.join(__dirname, "./migrations/*")],
        entities: [Post, User, Updoot]
    });
    await conn.runMigrations();

    // await Post.delete({});
    // AHHHHHHHHHHHHHH
    const app = express();

    const RedisStore = connectRedis(session)
    const redis = new Redis();
    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true,
        })
    )
    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({ 
                client: redis as any,
                disableTouch: true,
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
                httpOnly: true,
                sameSite: 'lax', // csrf
                secure: __prod__ // cookie only works in https
            },
            secret: 'asdasdawfaeeeaf',
            saveUninitialized: false,
            resave: false,
        })
    )


    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: ({ req, res }): MyContex => ({ req, res, redis, 
            userLoader: createUserLoader(),
            updootLoader: createUpdootLoader(),
        })
    })

    apolloServer.applyMiddleware({ app, cors: false })

    app.get('/', (_, res) => {
        res.send('Hello')
    })
    app.listen(process.env.PORT, () => {
        console.log('Server started on localhost:4000');
    })
    
};

main().catch((err) => {
    console.error(err);
});

