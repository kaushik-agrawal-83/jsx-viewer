import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

router.post('/read', async (req: Request, res: Response) => {
  const { path: filePath } = req.body as { path?: string };

  if (!filePath) {
    res.status(400).json({ error: 'path is required' });
    return;
  }

  // Reject relative traversal sequences
  if (filePath.includes('..') || !path.isAbsolute(filePath)) {
    res.status(403).json({ error: 'path must be absolute and must not contain ..' });
    return;
  }

  const resolved = path.resolve(filePath);
  console.log(`[files] read: ${resolved}`);

  try {
    const content = await fs.readFile(resolved, 'utf8');
    res.json({ content });
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      res.status(500).json({ error: 'Failed to read file' });
    }
  }
});

export default router;
