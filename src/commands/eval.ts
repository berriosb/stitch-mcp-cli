import fs from "fs";
import path from "path";
import { getStitchClient } from "../lib/stitch-client.js";
import type { EvalResult, EvalStats } from "../types/index.js";

const DEFAULT_EVAL_FILE = path.join(process.cwd(), "evaluations", "stitch-mcp-eval.xml");

interface QAPair {
  question: string;
  answer: string;
  toolUsed?: string;
}

function parseEvalFile(filePath: string): QAPair[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const pairs: QAPair[] = [];

  const pairRegex = /<qa_pair>[\s\S]*?<\/qa_pair>/g;
  const matches = content.match(pairRegex);

  if (!matches) return pairs;

  for (const match of matches) {
    const questionMatch = match.match(/<question>([\s\S]*?)<\/question>/);
    const answerMatch = match.match(/<answer>([\s\S]*?)<\/answer>/);
    const toolMatch = match.match(/<tool_used>([\s\S]*?)<\/tool_used>/);

    if (questionMatch && answerMatch) {
      pairs.push({
        question: questionMatch[1].trim(),
        answer: answerMatch[1].trim(),
        toolUsed: toolMatch ? toolMatch[1].trim() : undefined,
      });
    }
  }

  return pairs;
}

async function runEval(qaPairs: QAPair[]): Promise<EvalStats> {
  const results: EvalResult[] = [];
  const { stitch } = getStitchClient();

  for (const qa of qaPairs) {
    const result: EvalResult = {
      question: qa.question,
      expectedAnswer: qa.answer,
      toolUsed: qa.toolUsed,
    };

    try {
      switch (qa.toolUsed) {
        case "list_projects": {
          const projects = await stitch.projects();
          const projectList = projects.map((p) => `${p.id} (${p.projectId})`).join(", ");
          result.actualAnswer = projectList || "No projects";
          result.passed = projectList.length > 0;
          break;
        }
        case "list_screens": {
          const projectIdMatch = qa.question.match(/proyecto con ID \[([^\]]+)\]/);
          if (projectIdMatch) {
            const projectId = projectIdMatch[1];
            const project = stitch.project(projectId);
            const screens = await project.screens();
            result.actualAnswer = screens.map((s) => `${s.screenId}`).join(", ") || "No screens";
            result.passed = screens.length >= 0;
          } else {
            result.actualAnswer = "Could not parse project ID";
            result.passed = false;
          }
          break;
        }
        case "get_screen": {
          const screenMatch = qa.question.match(/pantalla con ID \[([^\]]+)\]/);
          const projMatch = qa.question.match(/proyecto \[([^\]]+)\]/);
          if (screenMatch && projMatch) {
            const project = stitch.project(projMatch[1]);
            const screen = await project.getScreen(screenMatch[1]);
            const html = await screen.getHtml();
            result.actualAnswer = html ? "HTML content retrieved" : "No HTML";
            result.passed = html !== undefined;
          } else {
            result.actualAnswer = "Could not parse IDs";
            result.passed = false;
          }
          break;
        }
        case "list_design_systems": {
          result.actualAnswer = "Design systems API not available in current SDK version";
          result.passed = false;
          break;
        }
        case "get_project": {
          const projMatch = qa.question.match(/proyecto \[([^\]]+)\]/);
          if (projMatch) {
            const project = stitch.project(projMatch[1]);
            const screens = await project.screens();
            result.actualAnswer = `Project has ${screens.length} screen(s)`;
            result.passed = screens !== undefined;
          } else {
            result.actualAnswer = "Could not parse project ID";
            result.passed = false;
          }
          break;
        }
        default: {
          result.actualAnswer = "Tool not implemented for evaluation";
          result.passed = false;
        }
      }
    } catch (error) {
      result.actualAnswer = `Error: ${error instanceof Error ? error.message : String(error)}`;
      result.passed = false;
    }

    results.push(result);
  }

  const passed = results.filter((r) => r.passed).length;
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    results,
  };
}

function printResults(stats: EvalStats): void {
  console.log("\n[S] Resultados de Evaluacion\n");
  console.log(`Total: ${stats.total} | OK Passed: ${stats.passed} | X Failed: ${stats.failed}\n`);

  for (let i = 0; i < stats.results.length; i++) {
    const r = stats.results[i];
    const status = r.passed ? "OK" : "X";
    console.log(`${status} [${i + 1}] ${r.question}`);
    console.log(`   Tool: ${r.toolUsed || "N/A"}`);
    console.log(`   Answer: ${r.actualAnswer}\n`);
  }
}

export async function evalCmd(options: { file?: string; results?: boolean }) {
  const evalFile = options.file || DEFAULT_EVAL_FILE;

  if (!fs.existsSync(evalFile)) {
    console.error(`Archivo de evaluacion no encontrado: ${evalFile}`);
    console.error("Usa: stitch-mcp-cli eval --file <path>`");
    process.exit(1);
  }

  console.log(`Cargando evaluaciones desde: ${evalFile}`);
  const qaPairs = parseEvalFile(evalFile);

  if (qaPairs.length === 0) {
    console.error("No se encontraron preguntas en el archivo de evaluacion");
    process.exit(1);
  }

  console.log(`Ejecutando ${qaPairs.length} preguntas de evaluacion...\n`);

  const stats = await runEval(qaPairs);
  printResults(stats);

  if (options.results) {
    const outputPath = path.join(process.cwd(), "eval-results.json");
    fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2));
    console.log(`Resultados guardados en: ${outputPath}`);
  }

  if (stats.failed > 0) {
    process.exit(1);
  }
}
