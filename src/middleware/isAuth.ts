import { MyContex } from "../types";
import { MiddlewareFn } from "type-graphql";

export const isAuth: MiddlewareFn<MyContex> = ({context}, next) => {
    if (!context.req.session.userId) {
        throw new Error('not authenticated')
    }

    return next()
}