// Add tabs section
const fs = require('fs');
const file = fs.readFileSync('pages/cad-interface.js', 'utf8');
const headerEnd = file.indexOf('</header>') + '</header>'.length;
const mainContent = file.indexOf('{/* Main content area */}');
const beforeHeader = file.substring(0, headerEnd);
const afterMainContent = file.substring(mainContent);

const tabSection = `

        {/* Main toolbar */}
        <div className="flex flex-col border-b border-gray-200">
          {/* Tab navigation */}
          <div className="flex items-center h-10 px-2 bg-gray-100">
            {toolbarTabs.map((tab) => (
              <button
                key={tab.id}
                className={\`px-3 py-1.5 text-sm font-medium rounded-t \${
                  activeTab === tab.id
                    ? "bg-white text-blue-600 border-t-2 border-blue-600"
                    : "text-gray-600 hover:bg-gray-200"
                }\`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tool buttons */}
          <div className="flex items-center h-10 px-2 bg-white overflow-x-auto">
            {/* View tools */}
            <div className="flex items-center pr-3 mr-3 border-r border-gray-200">
              {viewTools.map((tool) => (
                <button
                  key={tool.id}
                  className="flex items-center px-2 py-1 mx-0.5 text-xs text-gray-700 hover:bg-gray-100 rounded"
                  title={tool.label}
                >
                  {tool.icon}
                  <span className="ml-1">{tool.label}</span>
                </button>
              ))}
            </div>

            {/* Active tab tools */}
            <div className="flex items-center pr-3 mr-3 border-r border-gray-200">
              {activeTab === "sketch" ? (
                <>
                  {sketchTools.map((tool) => (
                    <button
                      key={tool.id}
                      className="flex items-center justify-center w-8 h-8 mx-0.5 text-gray-700 hover:bg-gray-100 rounded"
                      title={tool.tooltip}
                    >
                      {tool.icon}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {modelTools.map((tool) => (
                    <button
                      key={tool.id}
                      className="flex items-center justify-center w-8 h-8 mx-0.5 text-gray-700 hover:bg-gray-100 rounded"
                      title={tool.tooltip}
                    >
                      {tool.icon}
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* View mode tools */}
            <div className="flex items-center pr-3 mr-3 border-r border-gray-200">
              <button
                className={\`flex items-center justify-center w-8 h-8 mx-0.5 rounded \${viewMode === "wireframe" ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"}\`}
                title="Wireframe"
                onClick={() => setViewMode("wireframe")}
              >
                <Grid size={16} />
              </button>
              <button
                className={\`flex items-center justify-center w-8 h-8 mx-0.5 rounded \${viewMode === "shaded" ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"}\`}
                title="Shaded"
                onClick={() => setViewMode("shaded")}
              >
                <Box size={16} />
              </button>
              <button
                className={\`flex items-center justify-center w-8 h-8 mx-0.5 rounded \${viewMode === "rendered" ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"}\`}
                title="Rendered"
                onClick={() => setViewMode("rendered")}
              >
                <Maximize size={16} />
              </button>
            </div>

            {/* Navigation tools */}
            <div className="flex items-center">
              <button
                className="flex items-center justify-center w-8 h-8 mx-0.5 text-gray-700 hover:bg-gray-100 rounded"
                title="Pan"
              >
                <Move size={16} />
              </button>
              <button
                className="flex items-center justify-center w-8 h-8 mx-0.5 text-gray-700 hover:bg-gray-100 rounded"
                title="Rotate"
              >
                <RotateCcw size={16} />
              </button>
              <button
                className="flex items-center justify-center w-8 h-8 mx-0.5 text-gray-700 hover:bg-gray-100 rounded"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                className="flex items-center justify-center w-8 h-8 mx-0.5 text-gray-700 hover:bg-gray-100 rounded"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
            </div>
          </div>
        </div>
`;

fs.writeFileSync('pages/cad-interface.js', beforeHeader + tabSection + afterMainContent);
console.log('File updated successfully.');
