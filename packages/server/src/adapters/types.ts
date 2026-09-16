export type DimahFormHandlerSource = {
  handler: (request: Request) => Promise<Response>;
};
