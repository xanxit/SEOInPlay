import React,{useState} from "react";
import axios from "axios"

const App = () => {
  const [sitemap,setSitemap] = useState("");
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const callAPI=async()=>{
    console.log(sitemap);
    setIsLoading(true);
    if(sitemap.includes(".xml"))
    {
      const res = await axios.post("http://localhost:2000/download-md",{sitemap:sitemap});
      console.log(res.data);
      setData(res.data);
     
    }
    else{
      alert("Please enter a valid sitemap.xml URL")
    }
    setIsLoading(false);
  }
  const handlePageChange = page => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = itemsPerPage => {
    setItemsPerPage(itemsPerPage);
    setCurrentPage(1);
  };

  const handleDropdownChange = e => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const pages = [...Array(totalPages).keys()].map(i => i + 1);
  return (
    <div className="flex flex-col overflow-x-scroll">
      <div className="flex h-full w-screen items-start justify-center mt-10 p-5">
        <div className="rounded-lg bg-gray-200 p-5 w-2/4">
          <div className="flex">
            <div className="flex w-10 items-center justify-center rounded-tl-lg rounded-bl-lg border-r border-gray-200 bg-white p-5">
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="pointer-events-none absolute w-5 fill-gray-500 transition"
              >
                <path d="M16.72 17.78a.75.75 0 1 0 1.06-1.06l-1.06 1.06ZM9 14.5A5.5 5.5 0 0 1 3.5 9H2a7 7 0 0 0 7 7v-1.5ZM3.5 9A5.5 5.5 0 0 1 9 3.5V2a7 7 0 0 0-7 7h1.5ZM9 3.5A5.5 5.5 0 0 1 14.5 9H16a7 7 0 0 0-7-7v1.5Zm3.89 10.45 3.83 3.83 1.06-1.06-3.83-3.83-1.06 1.06ZM14.5 9a5.48 5.48 0 0 1-1.61 3.89l1.06 1.06A6.98 6.98 0 0 0 16 9h-1.5Zm-1.61 3.89A5.48 5.48 0 0 1 9 14.5V16a6.98 6.98 0 0 0 4.95-2.05l-1.06-1.06Z"></path>
              </svg>
            </div>
            <input
              type="text"
              className="w-full bg-white pl-2 text-base font-semibold outline-0"
              placeholder="Enter Sitemap.xml URL"
              value={sitemap}
              onChange={(e) => setSitemap(e.target.value)}
            />
            <input
              type="button"
              value= {isLoading ? "Loading..." : "Download"} 
              onClick={callAPI}
              className="bg-blue-500 p-2 rounded-tr-lg rounded-br-lg text-white font-semibold hover:bg-blue-800 transition-colors"
            />
          </div>
        </div>
      </div>
     
      {data.length > 0 && (
        <>
        {/* add a button named generate analytics in blue color */}
        <div className="flex justify-center">
        <button className="bg-blue-500 hover:bg-blue-700 text-white w-40 h-20  font-bold py-2 px-4 rounded"> Generate articles</button>
        </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                {Object.keys(data[0]).map(columnName => (
                  <th key={columnName} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{columnName}</th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keyword Volume Density</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(item => (
                <tr key={item.id}>
                  <td><input class="h-6 w-6 ml-4" type="checkbox" /></td>
                  {Object.keys(item).map(columnName => (
                    <td key={columnName} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item[columnName]}</td>
                  ))}
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4">
            <span className="mr-2">Items per page:</span>
            <select value={itemsPerPage} onChange={handleDropdownChange}>
              <option key="10" value="10">10</option>
              <option key="25" value="25">25</option>
              <option key="50" value="50">50</option>
              <option key="100" value="100">100</option>
            </select>

            <nav className="mt-4 mb-10">
              <span className="mr-2">Go to page:</span>
              <select value={currentPage} onChange={e => handlePageChange(parseInt(e.target.value))}>
                {pages.map(page => (
                  <option key={page} value={page}>{page}</option>
                ))}
              </select>
            </nav>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
