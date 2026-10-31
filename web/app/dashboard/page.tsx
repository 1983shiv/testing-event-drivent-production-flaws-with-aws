'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        position: 'frontend',
    });

    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<
        'idle' | 'submitting' | 'success' | 'error'
    >('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            router.push('/');
            return;
        }
        const { email } = JSON.parse(user);
        setFormData((prev) => ({ ...prev, email }));
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMessage('');
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    position: formData.position,
                    fileName: file?.name || null,
                    contentType: file ? (file.type || 'application/octet-stream') : null,
                }),
            });

            const payload: unknown = await res.json();
            const data = payload && typeof payload === 'object'
                ? payload as Record<string, unknown>
                : {};
            if (!res.ok) {
                throw new Error(
                    typeof data.error === 'string'
                        ? data.error
                        : `Application request failed (${res.status})`,
                );
            }

            if (file) {
                if (typeof data.presignedUrl !== 'string') {
                    throw new Error('The server did not provide an S3 upload URL');
                }

                const uploadResponse = await fetch(data.presignedUrl, {
                    method: 'PUT',
                    body: file,
                    headers: {
                        'Content-Type': file.type || 'application/octet-stream',
                        'x-amz-meta-applicant-name': formData.name,
                        'x-amz-meta-applicant-email': formData.email,
                        'x-amz-meta-position': formData.position,
                    },
                });
                if (!uploadResponse.ok) {
                    throw new Error(`S3 rejected the file upload (${uploadResponse.status})`);
                }
            } else if (typeof data.key !== 'string') {
                throw new Error('The server did not confirm the application upload');
            }

            setStatus('success');
        } catch (err) {
            console.error('Submission failed', err);
            setErrorMessage(err instanceof Error ? err.message : 'Submission failed. Please try again.');
            setStatus('error');
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const resetForm = () => {
        setStatus('idle');
        setFile(null);
        setFormData((prev) => ({
            ...prev,
            name: '',
            position: 'frontend',
        }));
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-gray-500 p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-8">
                        <h2 className="text-green-800 text-xl font-bold mb-2">
                            ✅ Application Submitted
                        </h2>
                        <p className="text-green-700 mb-4">
                            {file
                                ? 'Your application and resume were uploaded to S3.'
                                : 'Your application was uploaded to S3.'}
                        </p>
                        <ol className="text-green-700 space-y-2 text-sm list-decimal list-inside">
                            <li>
                                {file ? 'Resume file' : 'Application JSON'} saved to the <strong>S3</strong> bucket
                            </li>
                            <li>
                                The S3 event triggers <strong>Lambda</strong> to save your application to DynamoDB
                            </li>
                            <li>
                                <strong>EventBridge</strong> matched the upload
                                event and delivered an <strong>SNS</strong>{' '}
                                notification to the hiring team
                            </li>
                            <li>
                                <strong>EventBridge</strong> routed the event to
                                a file-type specific pipeline (
                                {file
                                    ? file.name.split('.').pop()?.toUpperCase()
                                    : 'JSON'}{' '}
                                log)
                            </li>
                        </ol>
                        <p className="text-green-600 text-xs mt-4">
                            Check CloudWatch logs, your email inbox, and the
                            DynamoDB table to verify.
                        </p>
                        <button
                            onClick={resetForm}
                            className="mt-6 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                        >
                            Submit Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">
                            Submit Application
                        </h1>
                        <p className="text-gray-500">
                            Fill in your details and optionally attach a resume
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.removeItem('user');
                            router.push('/');
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Sign out
                    </button>
                </div>
                {status === 'error' && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
                        {errorMessage || 'Something went wrong. Please try again.'}
                    </div>
                )}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-lg shadow-md space-y-5"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Jane Smith"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Position
                        </label>
                        <select
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="frontend">Frontend Developer</option>
                            <option value="backend">Backend Developer</option>
                            <option value="fullstack">
                                Full Stack Engineer
                            </option>
                            <option value="devops">DevOps Engineer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Resume{' '}
                            <span className="text-gray-400 font-normal">
                                (optional)
                            </span>
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.txt,.json"
                            onChange={(e) =>
                                setFile(e.target.files?.[0] || null)
                            }
                            className="w-full p-3 border border-gray-300 rounded-md file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Accepted formats: PDF, TXT, JSON — or skip to submit
                            without a file
                        </p>
                    </div>
                    <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="w-full bg-blue-600 text-white p-3 rounded-md font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                    >
                        {status === 'submitting'
                            ? 'Submitting...'
                            : 'Submit Application'}
                    </button>
                </form>
            </div>
        </div>
    );
}
