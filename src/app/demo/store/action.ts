'use server'

import { LibSQLVector } from "@mastra/libsql";

const vectorStore = new LibSQLVector({
    connectionUrl: process.env.VECTOR_DATABASE_URL || "file:./vector.db",
})

// Get dimension from environment variable
const EMBEDDING_DIMENSION = Number(process.env.EMBEDDING_DIMENSION) || 1536;

// Sample embeddings for demo purposes
const sampleEmbeddings = [
    Array.from({ length: EMBEDDING_DIMENSION }, () => Math.random()),
    Array.from({ length: EMBEDDING_DIMENSION }, () => Math.random()),
    Array.from({ length: EMBEDDING_DIMENSION }, () => Math.random()),
];

const sampleTexts = [
    "Machine learning is a subset of artificial intelligence that focuses on algorithms that can learn from data.",
    "Vector databases are specialized databases designed to store and query high-dimensional vectors efficiently.",
    "Embeddings are dense vector representations of data that capture semantic meaning in a continuous space."
];

export async function listIndexes() {
    try {
        const indexes = await vectorStore.listIndexes();
        return { success: true, data: indexes };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to list indexes' };
    }
}

export async function createIndex(indexName: string, dimension: number = EMBEDDING_DIMENSION) {
    try {
        await vectorStore.createIndex({
            indexName,
            dimension,
        });
        return { success: true, message: `Index '${indexName}' created successfully` };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create index' };
    }
}

export async function upsertEmbeddings(indexName: string) {
    try {
        await vectorStore.upsert({
            indexName,
            vectors: sampleEmbeddings,
            metadata: sampleTexts.map((text, index) => ({
                id: `doc_${index + 1}`,
                text,
                category: index === 0 ? 'AI/ML' : index === 1 ? 'Database' : 'Data Science',
                createdAt: new Date().toISOString(),
                version: '1.0',
                author: 'Demo System',
                confidenceScore: Math.random() * 0.3 + 0.7, // Random score between 0.7-1.0
            })),
        });
        return { success: true, message: `${sampleEmbeddings.length} embeddings upserted successfully` };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to upsert embeddings' };
    }
}

export async function queryEmbeddings(indexName: string, queryText: string = "artificial intelligence") {
    try {
        // Generate a random query vector for demo purposes
        const queryVector = Array.from({ length: EMBEDDING_DIMENSION }, () => Math.random());
        
        const results = await vectorStore.query({
            indexName,
            queryVector,
            topK: 3,
        });
        
        return { success: true, data: results };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to query embeddings' };
    }
}

export async function deleteIndex(indexName: string) {
    try {
        await vectorStore.deleteIndex({ indexName });
        return { success: true, message: `Index '${indexName}' deleted successfully` };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete index' };
    }
}

export async function getDefaultDimension() {
    return EMBEDDING_DIMENSION;
}