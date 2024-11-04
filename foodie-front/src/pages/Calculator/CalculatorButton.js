import "../../assets/css/Button.css";

const CalculatorButton = ({ className, value, onClick }) => {
  
  return (
    <button className={`${className} button-calc`} onClick={onClick}>
      {value}
    </button>
  );
};

export default CalculatorButton;
