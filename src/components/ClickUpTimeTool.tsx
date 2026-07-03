'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { type Dayjs } from 'dayjs'

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

export interface ClickUpUser {
  id: number;
  username: string;
  email: string;
  color: string;
  profilePicture: string;
  initials: string;
}

interface ClickUpTimeToolProps {
  apiKey: string;
  user: ClickUpUser;
}

async function fetchTeams(apiKey: string): Promise<ClickUpTeam[]> {
  const res = await fetch('https://api.clickup.com/api/v2/team', {
    headers: { Authorization: apiKey },
  });
  const data = await res.json();
  return data.teams;
}

async function fetchTasks(apiKey: string, teamId: string, from: string, to: string): Promise<ClickUpTask[]> {
  const startTs = new Date(from + 'T00:00:00').getTime();
  const endTs = new Date(to + 'T23:59:59.999').getTime();
  const query = new URLSearchParams({ start_date: String(startTs), end_date: String(endTs) });

  const res = await fetch(
    `https://api.clickup.com/api/v2/team/${teamId}/time_entries?${query}`,
    { headers: { Authorization: apiKey } },
  );
  const timeEntries = await res.json();

  const taskIds = [...new Set((timeEntries.data as ClickUpTimeEntry[] || [])
    .map(e => e.task?.id)
    .filter(Boolean))] as string[];

  const tasks: ClickUpTask[] = [];
  for (const taskId of taskIds) {
    try {
      const taskRes = await fetch(
        `https://api.clickup.com/api/v2/task/${taskId}?team_id=${teamId}`,
        { headers: { Authorization: apiKey } },
      );
      const task: ClickUpTask = await taskRes.json();
      if (!task.parent) tasks.push(task);
    } catch (error) {
      console.warn(`Failed to fetch task ${taskId}:`, error);
    }
  }
  return tasks;
}

export default function ClickUpTimeTool({ apiKey, user }: ClickUpTimeToolProps) {
  const [teams, setTeams] = useState<ClickUpTeam[]>([]);
  const [tasks, setTasks] = useState<ClickUpTask[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [fromDate, setFromDate] = useState<Dayjs>(() => dayjs().startOf('month'));
  const [toDate, setToDate] = useState<Dayjs>(() => dayjs().endOf('month'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadTeams = async () => {
    setError(undefined);
    try {
      const result = await fetchTeams(apiKey);
      setTeams(result);
      const teamId = result[0]?.id || '';
      setSelectedTeamId(teamId);
      return teamId;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load teams');
      return '';
    }
  };

  const loadTasks = async (teamId?: string) => {
    const team = teamId || selectedTeamId;
    if (!team) return;
    setLoading(true);
    setError(undefined);
    try {
      const result = await fetchTasks(apiKey, team, fromDate.format('YYYY-MM-DD'), toDate.format('YYYY-MM-DD'));
      setTasks(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Load teams then tasks on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      const teamId = await loadTeams();
      if (teamId) await loadTasks(teamId);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  const handleCopy = async () => {
    const tsv = tasks
      .map(t => [t.custom_id || 'N/A', t.name || 'Unknown Task', user.email.split('@')[0]].join('\t'))
      .join('\n');
    await navigator.clipboard.writeText(tsv);
  };

  if (loading && tasks.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={32} sx={{ mb: 2 }} />
        <Typography color="text.secondary">Loading ClickUp data…</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ my: 3 }}>{error}</Alert>;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
    <Stack spacing={3}>
      {/* Controls */}
      <Stack spacing={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Team</InputLabel>
          <Select
            value={selectedTeamId}
            label="Team"
            onChange={(e) => setSelectedTeamId(e.target.value)}
          >
            <MenuItem disabled value="">Select Team</MenuItem>
            {teams.map(team => (
              <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <DatePicker
            label="Start Date"
            value={fromDate}
            onChange={(v) => v && setFromDate(v)}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
          <DatePicker
            label="End Date"
            value={toDate}
            onChange={(v) => v && setToDate(v)}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
        </Stack>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => loadTasks()}
            disabled={loading || !selectedTeamId}
            loading={loading}
          >
            Get
          </Button>
        </Box>
      </Stack>

      {/* Results Table */}
      <Paper variant="outlined">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: { xs: 1.5, sm: 2 }, py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Time Entries ({tasks.length})
          </Typography>
          <IconButton size="small" onClick={handleCopy} title="Copy to clipboard">
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Box>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 400 }}>
            <TableHead>
              <TableRow>
                <TableCell>Task ID</TableCell>
                <TableCell>Task Name</TableCell>
                <TableCell>User Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} hover>
                  <TableCell>{task.custom_id || 'N/A'}</TableCell>
                  <TableCell>
                    <Link href={task.url} target="_blank" rel="noopener noreferrer" underline="hover">
                      {task.name || 'Unknown Task'}
                    </Link>
                  </TableCell>
                  <TableCell>{user.email.split('@')[0]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
    </LocalizationProvider>
  );
}
