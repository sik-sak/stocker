import StockChart from "./StockChart/StockChart";
import Header from "./Header/Header";
import RealData from "./RealData/RealData";
const Home = () =>{
    return(
        <div>
            <Header/>
            <StockChart/>

            <div style={{ margin:'10rem 0' }}> </div>
            <RealData/>
        </div>
    );
};

export default Home;