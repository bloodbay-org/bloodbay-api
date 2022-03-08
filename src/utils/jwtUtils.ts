import * as jwt from 'jsonwebtoken'
import config from './../config/config.json';

export const decodeToken = (token: string): JWTDecodedPayloadType => {
    return <JWTDecodedPayloadType>jwt.verify(token, process.env.JWT_SECRET ? process.env.JWT_SECRET : config.jwt_secret);
}

export const createToken = (id: string, email: string, username: string): string => {
    return jwt.sign(
        {id, email, username},
        process.env.JWT_SECRET ? process.env.JWT_SECRET : config.jwt_secret,
        {
            expiresIn: "1d",
        }
    );
}

export interface JWTDecodedPayloadType {
    email: string;
    exp: number;
    iat: number;
    id: string;
    username: string;
}
