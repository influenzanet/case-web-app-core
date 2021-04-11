export const parseGRPCTimestamp = (grpcValue?: number | string): number | undefined => {
  if (grpcValue !== undefined) {
    if (typeof (grpcValue) === 'string') {
      return parseInt(grpcValue);
    }
    return grpcValue;
  }
  return undefined;
}
