import { Button } from "reactstrap";
import "../../assets/css/Screen.css";

const Screen = ({ value, onClick }) => {
  return (
    <Button className="screen" mode="single" max={70} onClick={onClick}>
      {value}
    </Button>
  );
};

export default Screen;
