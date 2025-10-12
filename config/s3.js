const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Membuat instance klien S3 dengan kredensial dari file .env
const s3Client = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

/**
 * Fungsi untuk mengunggah file ke bucket S3.
 * @param {object} file - Objek file dari Multer (req.file atau req.files[i]).
 * @param {string} folder - Nama folder di dalam bucket untuk menyimpan file.
 * @returns {Promise<string>} URL publik dari file yang diunggah.
 */
const uploadFileToS3 = async (file, folder) => {
    // Membuat nama file yang unik untuk menghindari tumpang tindih
    const fileName = `${folder}/${uuidv4()}-${file.originalname.replace(/\s/g, '_')}`;

    // Menyiapkan parameter untuk perintah unggah
    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,        // Konten file
        ContentType: file.mimetype, // Jenis file (e.g., 'image/jpeg')
    };

    try {
        // Mengirim perintah untuk mengunggah objek ke S3
        await s3Client.send(new PutObjectCommand(params));
        
        // Mengkonstruksi dan mengembalikan URL publik dari file tersebut
        return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${fileName}`;
    } catch (error) {
        console.error("Gagal mengunggah ke S3:", error);
        throw error;
    }
};

module.exports = { uploadFileToS3 };