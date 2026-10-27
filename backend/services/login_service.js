import { getDependency } from '../dependency.js';
import bcrypt from 'bcrypt';
import { httpError } from '../utils/http_error.js';

export class LoginService {
  constructor() {
    this.userService = getDependency('userService');
    this.sessionService = getDependency('sessionService');
  }

  async login(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data))
      throw httpError(400, 'Los datos de inicio de sesión no son válidos');
    if (typeof data.username !== 'string' || !data.username.trim())
      throw httpError(400, 'El nombre de usuario es obligatorio');

    if (typeof data.password !== 'string' || !data.password)
      throw httpError(400, 'La contraseña es obligatoria');

    const user = await this.userService.getByUsername(data.username);
    if (!user)
      throw httpError(401, 'Usuario o contraseña incorrectos');

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch)
      throw httpError(401, 'Usuario o contraseña incorrectos');

    const session = await this.sessionService.createForUser(user);

    return {
      authorizationToken: session.authorizationToken,
      username: session.username,
      displayName: user.displayName,
      role: session.role,
    };
  }
}