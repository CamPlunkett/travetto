import * as ts from 'typescript';
import * as path from 'path';
import { TransformUtil, Import, State } from '@travetto/compiler';
import { Transform } from 'stream';
import { LogLevels } from '../types';

const VALID_METHODS = new Set(['log', ...Object.keys(LogLevels)]);

interface IState extends State {
  source: ts.SourceFile;
  file: string;
  imported?: ts.Identifier;
}

function visitNode<T extends ts.Node>(context: ts.TransformationContext, node: T, state: IState): T {
  if (ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.text === 'console' &&
    VALID_METHODS.has(node.expression.name.text)
  ) {

    if (!state.imported) {
      state.imported = ts.createIdentifier(`import_Logger`);
      state.newImports.push({
        ident: state.imported,
        path: require.resolve('../service/logger')
      });
    }

    const loc = ts.getLineAndCharacterOfPosition(state.source, node.pos);

    let payload = TransformUtil.fromLiteral({
      file: state.file,
      line: loc.line,
      level: node.expression.name.text
    });

    const args = node.arguments.slice(0);

    if (args.length) {
      const arg = args[0];
      if (ts.isStringLiteral(arg) || ts.isTemplateExpression(arg) || ts.isBinaryExpression(arg)) {
        payload = TransformUtil.extendObjectLiteral({
          message: args.shift()
        }, payload);
      }

      payload = TransformUtil.extendObjectLiteral({ args }, payload)
    }

    return ts.createCall(ts.createPropertyAccess(ts.createPropertyAccess(state.imported, 'Logger'), 'log'), undefined,
      ts.createNodeArray([payload])
    ) as any as T;
  } else {
    return ts.visitEachChild(node, c => visitNode(context, c, state), context);
  }
}

const RE_SEP = path.sep === '/' ? '\\/' : path.sep;
const PATH_RE = new RegExp(RE_SEP, 'g');

export const LoggerTransformer = {
  transformer: TransformUtil.importingVisitor<IState>((file: ts.SourceFile) => {
    let fileRoot = file.fileName;

    fileRoot = fileRoot
      .replace(process.cwd(), '')
      .replace(/^.*node_modules/, '')
      .replace(PATH_RE, '.')
      .replace(/^[.]/, '')
      .replace(/[.](t|j)s$/, '');

    return { file: `${fileRoot}`, source: file };
  }, visitNode),
  phase: 'before',
  priority: 0
}