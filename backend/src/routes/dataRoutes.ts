import { Router } from 'express';
import { getRoot, getData, uploadExcel } from '../controllers/dataController';
import { upload } from '../middleware/upload';

const router = Router();

router.get("/", getRoot);
router.get("/list", getData);
router.post("/upload-excel", upload.single('file'), uploadExcel);

export default router;
