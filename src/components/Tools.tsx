'use client'

import { useState } from 'react'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { type Tokens } from './AuthenticateStep'
import AuthenticateStep from './AuthenticateStep'
import ClickUpTimeTool from './ClickUpTimeTool'

interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  requiredToken: keyof Tokens;
}

const TOOLS: ToolDefinition[] = [
  {
    id: 'clickup-time',
    name: 'ClickUp Time Entries',
    description: 'Fetch your tracked time entries for the current month and copy to clipboard.',
    requiredToken: 'clickup',
  },
];

export default function Tools() {
  const [tokens, setTokens] = useState<Tokens>({});
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const hasTokens = !!(tokens.clickup || tokens.github);
  const availableTools = TOOLS.filter(t => tokens[t.requiredToken]);

  const handleSelectTool = (toolId: string) => {
    setSelectedTool(toolId);
    setActiveStep(2);
  };

  return (
    <section id="tools" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">
            Tools
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our comprehensive collection of tools designed to enhance your productivity
            and streamline your development workflow.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            <Step completed={hasTokens}>
              <StepLabel
                onClick={() => setActiveStep(0)}
                sx={{ cursor: 'pointer' }}
              >
                Authenticate
              </StepLabel>
            </Step>
            <Step completed={!!selectedTool}>
              <StepLabel
                onClick={() => hasTokens && setActiveStep(1)}
                sx={{ cursor: hasTokens ? 'pointer' : 'default' }}
              >
                Select Tool
              </StepLabel>
            </Step>
            <Step>
              <StepLabel
                onClick={() => selectedTool && setActiveStep(2)}
                sx={{ cursor: selectedTool ? 'pointer' : 'default' }}
              >
                {selectedTool ? TOOLS.find(t => t.id === selectedTool)?.name : 'Run Tool'}
              </StepLabel>
            </Step>
          </Stepper>

          {/* Step 1: Authenticate */}
          {activeStep === 0 && (
            <AuthenticateStep
              onTokensChange={(t) => setTokens(t)}
              tokens={tokens}
              onNext={() => setActiveStep(1)}
            />
          )}

          {/* Step 2: Select Tool */}
          {activeStep === 1 && (
            <div>
              {availableTools.length === 0 ? (
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  No tools available. Go back and enter a token first.
                </Typography>
              ) : (
                <div className="space-y-3 mb-4">
                  {availableTools.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => handleSelectTool(tool.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                        selectedTool === tool.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-semibold text-primary-900">{tool.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{tool.description}</div>
                    </button>
                  ))}
                </div>
              )}
              <Button
                size="small"
                onClick={() => setActiveStep(0)}
              >
                Back
              </Button>
            </div>
          )}

          {/* Step 3: Tool */}
          {activeStep === 2 && (
            <div>
              {selectedTool === 'clickup-time' && tokens.clickup && (
                <ClickUpTimeTool apiKey={tokens.clickup} />
              )}
              <div className="mt-4">
                <Button
                  size="small"
                  onClick={() => setActiveStep(1)}
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
