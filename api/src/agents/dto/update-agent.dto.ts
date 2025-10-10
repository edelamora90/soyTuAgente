// api/src/agents/dto/update-agent.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateAgentDto } from './create-agent.dto';

export class UpdateAgentDto extends PartialType(CreateAgentDto) {}

