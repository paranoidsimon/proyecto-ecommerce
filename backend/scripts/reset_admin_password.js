import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import config from '../config.js';
import userMongo from '../mongo-db/user_mongo.js';

const { RESET_ADMIN_USERNAME, RESET_ADMIN_PASSWORD } = process.env;

if (!RESET_ADMIN_USERNAME || !RESET_ADMIN_PASSWORD) {
  console.error('Define RESET_ADMIN_USERNAME y RESET_ADMIN_PASSWORD.');
  process.exitCode = 1;
} else if (RESET_ADMIN_PASSWORD.length < 8) {
  console.error('RESET_ADMIN_PASSWORD debe tener al menos 8 caracteres.');
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(config.dbConnection);
    const result = await userMongo.updateOne(
      { username: RESET_ADMIN_USERNAME.trim(), role: 'admin' },
      { $set: { password: await bcrypt.hash(RESET_ADMIN_PASSWORD, 10) } },
    );

    if (result.matchedCount !== 1)
      throw new Error('No se encontró un administrador con ese nombre de usuario.');

    console.log(`Contraseña del administrador "${RESET_ADMIN_USERNAME}" restablecida.`);
  } catch (error) {
    console.error('No se pudo restablecer la contraseña:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
