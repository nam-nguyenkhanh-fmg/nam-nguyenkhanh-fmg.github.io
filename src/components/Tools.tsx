'use client'

import { useState, useEffect } from 'react'

// ClickUp interfaces from reference.tsx
interface ClickUpTask {
  id: string;
  custom_id: string;
  name: string;
  parent: string;
  url: string;
}

interface ClickUpTimeEntry {
  id: string;
  task: {
    id: string;
    name: string;
    custom_id: string;
  };
  task_url: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
  start: string;
  end: string;
  duration: string;
}

interface ClickUpTeam {
  id: string;
  name: string;
}

interface ClickUpUser {
  id: number;
  username: string;
  email: string;
  color: string;
  profilePicture: string;
  initials: string;
}

export default function Tools() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ClickUp demo state
  const [clickUpApiKey, setClickUpApiKey] = useState<string>('');
  const [clickUpUser, setClickUpUser] = useState<ClickUpUser | null>(null);
  const [clickUpTeams, setClickUpTeams] = useState<ClickUpTeam[]>([]);
  const [clickUpTasks, setClickUpTasks] = useState<ClickUpTask[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  // Set default dates to current month's first and last day (accounting for UTC+7 timezone)
  const getCurrentMonthDates = () => {
    // Create date in local timezone (UTC+7)
    const now = new Date();
    
    // Get local date components to avoid UTC conversion issues
    const year = now.getFullYear();
    const month = now.getMonth(); // November = 10 (0-indexed)
    
    // Create dates using local timezone
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Format using local date methods to maintain timezone consistency
    const formatLocalDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    
    return {
      first: formatLocalDate(firstDay),
      last: formatLocalDate(lastDay)
    };
  };
  
  const [fromDate, setFromDate] = useState<string>(() => getCurrentMonthDates().first);
  const [toDate, setToDate] = useState<string>(() => getCurrentMonthDates().last);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // ClickUp API integration functions (from reference.tsx)
  const fetchClickUpUser = async (apiKey: string): Promise<{ user: ClickUpUser }> => {
    const response = await fetch("https://api.clickup.com/api/v2/user", {
      method: 'GET',
      headers: {
        Authorization: apiKey
      }
    });
    return await response.json();
  };

  const fetchClickUpTeams = async (apiKey: string): Promise<{ teams: ClickUpTeam[] }> => {
    const response = await fetch("https://api.clickup.com/api/v2/team", {
      method: 'GET',
      headers: {
        Authorization: apiKey
      }
    });
    return await response.json();
  };

  const fetchClickUpTasks = async (apiKey: string, teamId: string, startDate?: string, endDate?: string): Promise<ClickUpTask[]> => {
    // Get time entries first
    const query = new URLSearchParams();

    // Always add start_date and end_date (Unix timestamps in milliseconds)
    // Use provided dates or default to current month
    const currentMonthDates = getCurrentMonthDates();
    const effectiveStartDate = startDate || currentMonthDates.first;
    const effectiveEndDate = endDate || currentMonthDates.last;
    
    const startTimestamp = new Date(effectiveStartDate + 'T00:00:00').getTime(); // Start of day
    const endTimestamp = new Date(effectiveEndDate + 'T23:59:59.999').getTime(); // End of day
    
    query.set('start_date', startTimestamp.toString());
    query.set('end_date', endTimestamp.toString());

    // Optional parameters that can be added as needed:
    // query.set('assignee', '0');
    // query.set('include_task_tags', 'true');
    // query.set('include_location_names', 'true');
    // query.set('space_id', '0');
    // query.set('folder_id', '0');
    // query.set('list_id', '0');
    // query.set('task_id', 'string');
    // query.set('custom_task_ids', 'true');
    // query.set('is_billable', 'true');

    const timeEntriesResponse = await fetch(
      `https://api.clickup.com/api/v2/team/${teamId}/time_entries?${query.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: apiKey
      }
    });
    const timeEntries = await timeEntriesResponse.json();

    // Extract unique task IDs
    const taskIdSet = new Set<string>();
    const entries: ClickUpTimeEntry[] = timeEntries.data || [];
    entries.forEach((entry: ClickUpTimeEntry) => {
      if (entry.task?.id) {
        taskIdSet.add(entry.task.id);
      }
    });
    const taskIds = Array.from(taskIdSet);

    // Fetch individual tasks
    const tasks: ClickUpTask[] = [];
    for (const taskId of taskIds) {
      try {
        const taskResponse = await fetch(
          `https://api.clickup.com/api/v2/task/${taskId}?team_id=${teamId}`, {
          method: 'GET',
          headers: {
            Authorization: apiKey
          }
        });
        const task: ClickUpTask = await taskResponse.json();
        if (!task.parent) {
          tasks.push(task);
        }
      } catch (error) {
        console.warn(`Failed to fetch task ${taskId}:`, error);
      }
    }

    return tasks;
  };

  // Connect to ClickUp and fetch all data
  const handleConnectClickUp = async () => {
    if (!clickUpApiKey) {
      alert('Please enter your ClickUp API Key first');
      return;
    }

    setIsConnecting(true);

    try {
      // Step 1: Fetch user data
      const userData = await fetchClickUpUser(clickUpApiKey);
      setClickUpUser(userData.user);

      // Step 2: Fetch teams
      const teamsData = await fetchClickUpTeams(clickUpApiKey);
      setClickUpTeams(teamsData.teams);

      // Step 3: Fetch data from the selected team (if available)
      const currentSelectedTeamId = selectedTeamId || (teamsData.teams[0] && teamsData.teams[0].id);
      setSelectedTeamId(currentSelectedTeamId);
      const tasks = await fetchClickUpTasks(clickUpApiKey, currentSelectedTeamId, fromDate, toDate);
      setClickUpTasks(tasks);

      setTimeout(() => {
        document.getElementById('time-entries')?.scrollIntoView({ behavior: 'smooth' });
      }, 500); // Simulate delay for better UX

      setIsConnected(true);
    } catch (error) {
      console.error('ClickUp API Error:', error);
      alert('ClickUp API Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClearData = () => {
    const currentMonthDates = getCurrentMonthDates();
    setClickUpUser(null);
    setClickUpTeams([]);
    setClickUpTasks([]);
    setSelectedTeamId('');
    setFromDate(currentMonthDates.first);
    setToDate(currentMonthDates.last);
    setClickUpApiKey('');
    setIsConnected(false);
    setIsConnecting(false);
  };

  const handleCopyTable = async () => {
    try {
      // Create tab-separated format for proper column separation in sheets
      const rows = clickUpTasks.map(task => [
        task.custom_id || 'N/A',
        task.name || 'Unknown Task',
        clickUpUser?.email?.split('@')[0] || 'N/A'
      ]);
      
      const tsvContent = [...rows]
        .map(row => row.join('\t'))
        .join('\n');
      
      await navigator.clipboard.writeText(tsvContent);
    } catch (error) {
      console.error('Failed to copy table:', error);
      alert('Failed to copy table to clipboard');
    }
  };

  useEffect(() => {
    setClickUpUser(null);
    setClickUpTeams([]);
    setClickUpTasks([]);
    setSelectedTeamId('');
    setIsConnected(false);
    setIsConnecting(false);
  }, [clickUpApiKey]);

  useEffect(() => {
    setClickUpTasks([]);
  }, [selectedTeamId, fromDate, toDate]);

  return (
    <section id="tools" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-900 mb-8">
            Tools
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our comprehensive collection of tools designed to enhance your productivity
            and streamline your development workflow.
          </p>
        </div>

        {/* ClickUp Credentials Input */}
        <div className="max-w-md mx-auto bg-gray-50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-primary-900 mb-4 text-center">ClickUp</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                Personal API Token
              </label>
              <input
                type="password"
                id="apiKey"
                value={clickUpApiKey}
                onChange={(e) => setClickUpApiKey(e.target.value)}
                placeholder="Enter your ClickUp API Key"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isConnecting}
              />
              <p className="text-xs text-gray-500 mt-1">
                <a
                  href="https://developer.clickup.com/docs/authentication#personal-token"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700"
                >
                  How to get your Personal API Token →
                </a>
              </p>
            </div>

            {isConnected && (
              <>
                <div>
                  <label htmlFor="teamSelect" className="block text-sm font-medium text-gray-700 mb-2">
                    Team
                  </label>
                  <select
                    id="teamSelect"
                    value={selectedTeamId}
                    onChange={(e) => {
                      const newTeamId = e.target.value;
                      setSelectedTeamId(newTeamId);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a team...</option>
                    {clickUpTeams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="fromDate"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="toDate"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-center">
              <button
                onClick={handleConnectClickUp}
                disabled={isConnecting || !clickUpApiKey}
                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${isConnecting || !clickUpApiKey
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700 hover:scale-105'
                  }`}
              >
                {isConnecting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  'Get'
                )}
              </button>
            </div>

            {(isConnected || clickUpApiKey) && (
              <div className="flex justify-center">
                <button
                  onClick={handleClearData}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  {isConnected ? 'Disconnect' : 'Clear'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Time Entries Table */}
        {isConnected && (
          <div className="bg-green-50 rounded-xl p-8" id="time-entries">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-green-900">
                Time Entries ({clickUpTasks.length})
              </h3>
              <button
                onClick={handleCopyTable}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Name
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clickUpTasks.map((task, index) => (
                    <tr key={task.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.custom_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <a href={task.url} target="_blank" rel="noopener noreferrer">{task.name || 'Unknown Task'}</a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {clickUpUser?.email?.split('@')[0] || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}