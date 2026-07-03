'use client'

import { useState, useEffect } from 'react'

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

interface ClickUpTimeToolProps {
  apiKey: string;
}

export default function ClickUpTimeTool({ apiKey }: ClickUpTimeToolProps) {
  const [clickUpUser, setClickUpUser] = useState<ClickUpUser | null>(null);
  const [clickUpTeams, setClickUpTeams] = useState<ClickUpTeam[]>([]);
  const [clickUpTasks, setClickUpTasks] = useState<ClickUpTask[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const getCurrentMonthDates = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const formatLocalDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    return { first: formatLocalDate(firstDay), last: formatLocalDate(lastDay) };
  };

  const [fromDate, setFromDate] = useState<string>(() => getCurrentMonthDates().first);
  const [toDate, setToDate] = useState<string>(() => getCurrentMonthDates().last);

  const fetchClickUpUser = async (key: string): Promise<{ user: ClickUpUser }> => {
    const response = await fetch("https://api.clickup.com/api/v2/user", {
      method: 'GET',
      headers: { Authorization: key }
    });
    return await response.json();
  };

  const fetchClickUpTeams = async (key: string): Promise<{ teams: ClickUpTeam[] }> => {
    const response = await fetch("https://api.clickup.com/api/v2/team", {
      method: 'GET',
      headers: { Authorization: key }
    });
    return await response.json();
  };

  const fetchClickUpTasks = async (key: string, teamId: string, startDate?: string, endDate?: string): Promise<ClickUpTask[]> => {
    const query = new URLSearchParams();
    const currentMonthDates = getCurrentMonthDates();
    const effectiveStartDate = startDate || currentMonthDates.first;
    const effectiveEndDate = endDate || currentMonthDates.last;
    const startTimestamp = new Date(effectiveStartDate + 'T00:00:00').getTime();
    const endTimestamp = new Date(effectiveEndDate + 'T23:59:59.999').getTime();
    query.set('start_date', startTimestamp.toString());
    query.set('end_date', endTimestamp.toString());

    const timeEntriesResponse = await fetch(
      `https://api.clickup.com/api/v2/team/${teamId}/time_entries?${query.toString()}`, {
      method: 'GET',
      headers: { Authorization: key }
    });
    const timeEntries = await timeEntriesResponse.json();

    const taskIdSet = new Set<string>();
    const entries: ClickUpTimeEntry[] = timeEntries.data || [];
    entries.forEach((entry: ClickUpTimeEntry) => {
      if (entry.task?.id) taskIdSet.add(entry.task.id);
    });
    const taskIds = Array.from(taskIdSet);

    const tasks: ClickUpTask[] = [];
    for (const taskId of taskIds) {
      try {
        const taskResponse = await fetch(
          `https://api.clickup.com/api/v2/task/${taskId}?team_id=${teamId}`, {
          method: 'GET',
          headers: { Authorization: key }
        });
        const task: ClickUpTask = await taskResponse.json();
        if (!task.parent) tasks.push(task);
      } catch (error) {
        console.warn(`Failed to fetch task ${taskId}:`, error);
      }
    }
    return tasks;
  };

  const handleConnect = async () => {
    if (!apiKey) return;
    setIsConnecting(true);
    try {
      const userData = await fetchClickUpUser(apiKey);
      setClickUpUser(userData.user);

      const teamsData = await fetchClickUpTeams(apiKey);
      setClickUpTeams(teamsData.teams);

      const teamId = selectedTeamId || (teamsData.teams[0] && teamsData.teams[0].id);
      setSelectedTeamId(teamId);
      const tasks = await fetchClickUpTasks(apiKey, teamId, fromDate, toDate);
      setClickUpTasks(tasks);

      setIsConnected(true);
    } catch (error) {
      console.error('ClickUp API Error:', error);
      alert('ClickUp API Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    const dates = getCurrentMonthDates();
    setClickUpUser(null);
    setClickUpTeams([]);
    setClickUpTasks([]);
    setSelectedTeamId('');
    setFromDate(dates.first);
    setToDate(dates.last);
    setIsConnected(false);
    setIsConnecting(false);
  };

  const handleCopyTable = async () => {
    try {
      const rows = clickUpTasks.map(task => [
        task.custom_id || 'N/A',
        task.name || 'Unknown Task',
        clickUpUser?.email?.split('@')[0] || 'N/A'
      ]);
      const tsvContent = rows.map(row => row.join('\t')).join('\n');
      await navigator.clipboard.writeText(tsvContent);
    } catch (error) {
      console.error('Failed to copy table:', error);
      alert('Failed to copy table to clipboard');
    }
  };

  useEffect(() => {
    handleDisconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  useEffect(() => {
    setClickUpTasks([]);
  }, [selectedTeamId, fromDate, toDate]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="space-y-4">
        {isConnected && (
          <>
            <div>
              <label htmlFor="teamSelect" className="block text-sm font-medium text-gray-700 mb-2">
                Team
              </label>
              <select
                id="teamSelect"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
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

        <div className="flex justify-center gap-3">
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${isConnecting
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
          {isConnected && (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Results Table */}
      {isConnected && (
        <div className="bg-green-50 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-bold text-green-900">
              Time Entries ({clickUpTasks.length})
            </h4>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clickUpTasks.map((task, index) => (
                  <tr key={task.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.custom_id || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <a href={task.url} target="_blank" rel="noopener noreferrer">{task.name || 'Unknown Task'}</a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{clickUpUser?.email?.split('@')[0] || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
