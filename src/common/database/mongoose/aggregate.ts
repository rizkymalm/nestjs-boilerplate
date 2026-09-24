import { Model, PipelineStage } from 'mongoose';

export async function aggregate<T>(
  model: Model<unknown>,
  pipeline: PipelineStage[],
): Promise<T[]> {
  return model.aggregate<T>(pipeline).exec();
}
