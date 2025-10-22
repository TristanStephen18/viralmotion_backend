import {  RenderMediaOnDownload } from "@remotion/renderer";
import type { Request, Response } from "express";

const jobs = new Map<string, RenderMediaOnDownload>();

export const cancelRender = (req: Request, res: Response) => {
  const { jobId } = req.body;
  const render = jobs.get(jobId);

  if (!render) {
    return res.status(404).json({ error: "Job not found" });
  }

//   render.;
  jobs.delete(jobId);

  res.json({ status: "canceled", jobId });
};