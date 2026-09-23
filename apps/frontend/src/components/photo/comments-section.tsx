'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { App, Avatar, Button, Form, Input, Popconfirm } from 'antd';
import { UserRole, type PublicComment } from '@photography/types';
import { ApiError, client } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';

export function CommentsSection({ photoId }: { photoId: string }) {
  const { isAuthenticated, user } = useAuth();
  const { message } = App.useApp();
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [form] = Form.useForm<{ body: string }>();

  useEffect(() => {
    client
      .listComments(photoId)
      .then((res) => setComments(res.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [photoId]);

  // Group the flat list into top-level comments + their replies.
  const { roots, repliesByParent } = useMemo(() => {
    const roots: PublicComment[] = [];
    const repliesByParent = new Map<string, PublicComment[]>();
    // oldest first reads naturally in a thread
    const ordered = [...comments].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    for (const c of ordered) {
      if (c.parentId) {
        const list = repliesByParent.get(c.parentId) ?? [];
        list.push(c);
        repliesByParent.set(c.parentId, list);
      } else {
        roots.push(c);
      }
    }
    roots.reverse(); // newest threads first
    return { roots, repliesByParent };
  }, [comments]);

  const post = async (body: string, parentId?: string) => {
    setSubmitting(true);
    try {
      const created = await client.addComment(photoId, body, parentId);
      setComments((prev) => [...prev, created]);
      form.resetFields();
      setReplyTo(null);
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Could not post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await client.deleteComment(id);
      // drop the comment and any of its replies
      setComments((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
      message.success('Comment deleted');
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Could not delete');
    }
  };

  const canDelete = (c: PublicComment) =>
    user && (user.id === c.authorId || user.role === UserRole.ADMIN);

  const renderComment = (c: PublicComment, isReply = false) => (
    <div key={c.id} className={isReply ? 'mt-4 flex gap-3' : 'flex gap-3'}>
      <Avatar src={c.authorAvatarUrl ?? undefined} size={isReply ? 'small' : 'default'}>
        {c.authorDisplayName[0]}
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          {c.authorDisplayName}{' '}
          <span className="font-normal text-ink-muted">
            · {new Date(c.createdAt).toLocaleDateString()}
          </span>
        </p>
        <p className="text-ink dark:text-parchment/90">{c.body}</p>
        <div className="mt-1 flex gap-3 text-xs text-ink-muted">
          {isAuthenticated && !isReply && (
            <button
              type="button"
              className="hover:text-primary"
              onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
            >
              Reply
            </button>
          )}
          {canDelete(c) && (
            <Popconfirm title="Delete this comment?" onConfirm={() => remove(c.id)}>
              <button type="button" className="hover:text-red-500">
                Delete
              </button>
            </Popconfirm>
          )}
        </div>

        {replyTo === c.id && (
          <ReplyForm
            submitting={submitting}
            onSubmit={(body) => post(body, c.id)}
            onCancel={() => setReplyTo(null)}
          />
        )}

        {(repliesByParent.get(c.id) ?? []).map((r) => renderComment(r, true))}
      </div>
    </div>
  );

  return (
    <section className="mt-12">
      <h2 className="font-display mb-4 text-tagline font-semibold">
        Comments{' '}
        {comments.length > 0 && <span className="text-ink-muted">({comments.length})</span>}
      </h2>

      {isAuthenticated ? (
        <Form form={form} onFinish={({ body }) => post(body)} className="mb-8">
          <Form.Item name="body" rules={[{ required: true, message: 'Write something first' }]}>
            <Input.TextArea
              rows={3}
              placeholder="Share your thoughts…"
              maxLength={2000}
              showCount
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Post comment
          </Button>
        </Form>
      ) : (
        <p className="mb-8 text-sm text-ink-muted">
          <Link href="/login" className="text-primary">
            Sign in
          </Link>{' '}
          to join the conversation.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink-muted">Loading comments…</p>
      ) : roots.length === 0 ? (
        <p className="text-sm text-ink-muted">No comments yet — be the first.</p>
      ) : (
        <div className="space-y-6">{roots.map((c) => renderComment(c))}</div>
      )}
    </section>
  );
}

function ReplyForm({
  submitting,
  onSubmit,
  onCancel,
}: {
  submitting: boolean;
  onSubmit: (body: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState('');
  return (
    <div className="mt-2">
      <Input.TextArea
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Write a reply…"
        maxLength={2000}
      />
      <div className="mt-2 flex gap-2">
        <Button
          size="small"
          type="primary"
          loading={submitting}
          disabled={!value.trim()}
          onClick={() => onSubmit(value.trim())}
        >
          Reply
        </Button>
        <Button size="small" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
