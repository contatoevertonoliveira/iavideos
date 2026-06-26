// react-bootstrap
import { ListGroup, Dropdown } from 'react-bootstrap';

// third party
import FeatherIcon from 'feather-icons-react';
import { Link } from 'react-router-dom';

// -----------------------|| NAV LEFT ||-----------------------//

export default function NavLeft() {
  return (
    // Remove o menu "Level" conforme solicitado; deixamos a área vazia
    <ListGroup as="ul" bsPrefix=" " className="list-unstyled" />
  );
}
