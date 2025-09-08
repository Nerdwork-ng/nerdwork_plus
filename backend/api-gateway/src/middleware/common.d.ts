import { Request, Response, NextFunction } from "express";
export declare const globalErrorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;
export declare const globalNotFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
