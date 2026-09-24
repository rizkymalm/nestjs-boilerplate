import { Model, PipelineStage } from 'mongoose';

export async function aggregateSingle<TDocument, TResult>(
  model: Model<TDocument>,
  pipeline: PipelineStage[],
): Promise<TResult | null> {
  const result = await model.aggregate<TResult>(pipeline).exec();

  return result[0] ?? null;
}
