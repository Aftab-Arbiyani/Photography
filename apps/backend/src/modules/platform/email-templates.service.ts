import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate } from './entities/email-template.entity';

@Injectable()
export class EmailTemplatesService {
  constructor(
    @InjectRepository(EmailTemplate) private readonly templateRepository: Repository<EmailTemplate>,
  ) {}

  list(): Promise<EmailTemplate[]> {
    return this.templateRepository.find({ order: { key: 'ASC' } });
  }

  /** Render a template's subject + body, substituting {{placeholders}}. */
  async render(
    key: string,
    vars: Record<string, string | number>,
  ): Promise<{ subject: string; html: string }> {
    const template = await this.templateRepository.findOne({ where: { key, isActive: true } });
    if (!template) throw new NotFoundException(`Email template "${key}" not found`);
    const apply = (text: string) =>
      text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, name: string) => String(vars[name] ?? ''));
    return { subject: apply(template.subject), html: apply(template.htmlBody) };
  }

  async upsert(key: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const existing = await this.templateRepository.findOne({ where: { key } });
    const template = existing
      ? Object.assign(existing, data)
      : this.templateRepository.create({ key, subject: '', htmlBody: '', ...data });
    return this.templateRepository.save(template);
  }
}
