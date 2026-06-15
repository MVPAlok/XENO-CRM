const clientsByWorkspace = new Map();

export const subscribeToWorkspace = (workspaceId, res) => {
  if (!clientsByWorkspace.has(workspaceId)) clientsByWorkspace.set(workspaceId, new Set());
  clientsByWorkspace.get(workspaceId).add(res);
};

export const unsubscribeFromWorkspace = (workspaceId, res) => {
  const clients = clientsByWorkspace.get(workspaceId);
  if (!clients) return;
  clients.delete(res);
  if (clients.size === 0) clientsByWorkspace.delete(workspaceId);
};

export const publishWorkspaceEvent = (workspaceId, event, data) => {
  const clients = clientsByWorkspace.get(workspaceId);
  if (!clients) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    res.write(payload);
  }
};
