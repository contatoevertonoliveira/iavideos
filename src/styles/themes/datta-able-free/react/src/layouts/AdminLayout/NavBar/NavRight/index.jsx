import { Link, useNavigate } from 'react-router-dom';

// react-bootstrap
import { ListGroup, Dropdown, Form } from 'react-bootstrap';

// third party
import FeatherIcon from 'feather-icons-react';

// auth store
import { useAuthStore } from '@/features/auth/store';

// -----------------------|| NAV RIGHT ||-----------------------//

export default function NavRight() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.ctx?.user?.role || s.user.role);
  const clear = useAuthStore((s) => s.clear);
  const nav = useNavigate();
  const isLogged = Boolean(user?.name || user?.email);
  return (
    <ListGroup as="ul" bsPrefix=" " className="list-unstyled">
      <ListGroup.Item as="li" bsPrefix=" " className="pc-h-item">
        <Dropdown>
          <Dropdown.Toggle as="a" variant="link" className="pc-head-link arrow-none me-0">
            <i className="material-icons-two-tone">search</i>
          </Dropdown.Toggle>
          <Dropdown.Menu className="dropdown-menu-end pc-h-dropdown drp-search">
            <Form className="px-3">
              <div className="form-group mb-0 d-flex align-items-center">
                <FeatherIcon icon="search" />
                <Form.Control type="search" className="border-0 shadow-none" placeholder="Search here. . ." />
              </div>
            </Form>
          </Dropdown.Menu>
        </Dropdown>
      </ListGroup.Item>
      <ListGroup.Item as="li" bsPrefix=" " className="pc-h-item">
        {isLogged ? (
          <Dropdown className="drp-user">
            <Dropdown.Toggle as="a" variant="link" className="pc-head-link arrow-none me-0 user-name">
              {user?.picture ? (
                <img src={user.picture} alt="user-image" className="user-avtar" />
              ) : (
                <span className="user-avtar avtar-s btn-link-hover-primary" aria-label="user-image">
                  <i className="ph-duotone ph-user" />
                </span>
              )}
              <span className="ms-2">
                <span className="user-name">{user?.name || 'Usuário'}</span>
                <span className="user-desc">{String(role || 'Usuário')}</span>
              </span>
            </Dropdown.Toggle>
            <Dropdown.Menu className="dropdown-menu-end pc-h-dropdown">
              <Link to="/perfil" className="dropdown-item" role="menuitem">
                <i className="feather icon-user" /> Perfil
              </Link>
              <Link to="/settings/security" className="dropdown-item" role="menuitem">
                <i className="feather icon-lock" /> Trocar Senha
              </Link>
              <Dropdown.Divider />
              <Link
                to="#"
                className="dropdown-item"
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  clear();
                  nav('/login');
                }}
              >
                <i className="material-icons-two-tone">chrome_reader_mode</i> Sair
              </Link>
            </Dropdown.Menu>
          </Dropdown>
        ) : (
          <div className="d-flex align-items-center gap-2">
            <Link to="/login" className="pc-head-link arrow-none me-0">
              Entrar
            </Link>
            <Link to="/configuracoes/contas" className="pc-head-link arrow-none me-0">
              Cadastrar
            </Link>
          </div>
        )}
      </ListGroup.Item>
    </ListGroup>
  );
}
