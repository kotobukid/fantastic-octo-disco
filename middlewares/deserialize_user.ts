import {NextFunction, Response} from "express";


export default ((redis: any) => {
    return (req: Request & { cookies: { sid: string } } & { user: { name: string, id: string, password: string } }, res: Response, next: NextFunction) => {
        const sid: string = req.cookies.sid
        if (!!sid) {
            redis.hgetall(`auth:${sid}`).then((data: Record<string, string>) => {
                if (data) {
                    req.user = <{ name: string, id: string, password: string }>data
                }
                next()
            });
        } else {
            next();
        }
    }
});