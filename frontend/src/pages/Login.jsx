import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Form from '../components/Form';
import TextField from '../components/TextField';
import SecretField from '../components/SecretField';
import useLogin from '../services/useLogin';
import useApi from '../services/useApi';
import useGlobal from '../services/useGlobal';
import { toast } from 'react-toastify';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useLogin();
  const { setAuthorization } = useApi();
  const { setUsername, setDisplayName, setRole } = useGlobal();
  const [disabled, setDisabled] = useState(false);
  const [data, setData] = useState({
    username: '',
    password: '',
  });

  async function submitHandler(e) {
    e.preventDefault();
    setDisabled(true);

    try {
      const res = await login(data);
      localStorage.setItem('session', JSON.stringify(res));
      setAuthorization('Bearer ' + res.authorizationToken);
      setUsername(res.username);
      setDisplayName(res.displayName || res.username);
      setRole(res.role);
      toast.success('Sesión iniciada correctamente.');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error en el login.');
    }

    setDisabled(false);
  }

  function cancelHandler() {
    navigate('/');
  }

  return <Form
    title="Login"
    onSubmit={submitHandler}
    submitLabel="Iniciar sesión"
    onCancel={cancelHandler}
    disabled={disabled}
  >
    <TextField
      label="Nombre de usuario:"
      value={data.username}
      onChange={newValue => setData(data => ({ ...data, username: newValue }))}
      required
      disabled={disabled}
    />
    <SecretField
      label="Contraseña:"
      value={data.password}
      onChange={newValue => setData(data => ({ ...data, password: newValue }))}
      required
      disabled={disabled}
    />
  </Form>;
}