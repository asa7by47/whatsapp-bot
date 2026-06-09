import { Router } from 'express';
import { getWhatsAppStatus } from '../whatsapp';

const router = Router();

router.get('/', (_req, res) => {
  res.json(getWhatsAppStatus());
});

export default router;
