import { TickerWithExchange } from "../search/columns";
import { TimeFrameType } from "./time-frame";

export const Chart = ({
  timeFrame,
  tickerData,
}: {
  timeFrame: TimeFrameType;
  tickerData: TickerWithExchange;
}) => {
  // const [OHLCVData, setOHLCVData] = useState();
  console.log(timeFrame, tickerData);
  return <div></div>;
};
