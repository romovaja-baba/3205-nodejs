import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { JobForm } from './components/JobForm';
import { JobList } from './components/JobList';
import { JobDetails } from './components/JobDetails';

const App = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 3 }}>
      <Container maxWidth="lg">
        <Typography variant="h1" component="h1" sx={{ mb: 2.5 }}>
          Async URL Checker
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '340px 1fr' },
            gap: 2.5,
            alignItems: 'start',
          }}
        >
          <Stack spacing={2.5}>
            <JobForm />
            <JobList />
          </Stack>

          <Box>
            <JobDetails />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default App;
