<template>
<q-page>
  <div v-if="!gSt.egrC" class="q-pa-sm text-center text-italic titre-lg">{{$t('PGnoex')}}</div>

  <!-- Tab "groupe" -------------------------------------------------->
  <div v-if="ui.pagetab==='groupe' && gSt.egrC" class="q-pa-sm spmd column justify-center">
    <div v-if="amb" class="row q-mt-lg q-mb-md justify-around">
      <btn-cond icon="people" cond="cEdit"
        :label="$t('PGajctc')" @ok="ui.setPage('contactgr')"/>
      <btn-cond v-if="gSt.ambano[0]" icon="chat" :label="$t('PGchat')" cond="cVisu"
        @ok="ui.oD('ACGouvrir', idc)"/>
    </div>

    <div>
      <apercu-genx :id="idg" :idx="0"/>

      <div class="q-mr-sm">
        <q-icon v-if="nbiv" class="q-mr-xs" name="star" size="md" color="green-5"/>
        <span class="text-italic">{{$t('PGinv', nbiv, {count: nbiv})}}</span>
      </div>

      <div v-if="!gr.estRadie(1)" class="q-mt-sm titre-md q-mr-sm">{{$t('AGfond', [nom(1)])}}</div>
      <div v-else class="q-mt-sm fs-md text-italic">{{$t('AGnfond')}}</div>

      <div class="q-my-sm row justify-between">
        <div v-if="gr.msu" class="titre-md text-bold text-warning">{{$t('AGunanime')}}</div>
        <div v-else class="titre-md">{{$t('AGsimple')}}</div>
        <btn-cond class="col-auto q-ml-sm self-start" round
          icon="settings" @ok="editUna" cond="cVisu"/>
      </div>

      <q-expansion-item class="full-width q-mt-sm q-mb-xs" switch-toggle-side 
        :header-class="'titre-lg ' + (gr.dfh ? 'tbw' : 'tbp')"
        :label="$t('AGheb' + (gr.dfh ? '2' : '1'))">
        <div class="q-ma-sm">
          <div class="row justify-between">
            <div v-if="!gr.dfh" class="row">
              <span class="titre-md q-mr-sm">{{$t('AGheb')}}</span>
              <span class="fs-md">{{nom(gr.imh)}}</span>
            </div>
            <div v-else class="col fs-md text-warning text-bold">
              {{$t('AGnheb', [AMJ.editDeAmj(gr.dfh)])}}</div>
            <btn-cond class="col-auto q-ml-sm self-start" size="md" cond="cEdit"
              icon="settings" @ok="gererheb"/>
          </div>
          <quotas-vols class="q-mt-xs q-ml-md" :vols="vols" groupe/>
        </div>
      </q-expansion-item>

      <q-expansion-item class="full-width" switch-toggle-side header-class="tbp titre-lg"
        :label="$t('AGstm')">
        <div class="spsm q-mt-sm">
          <div class="row items-center titre-md text-italic justify-around">
            <div v-for="i in 5" :key="i" class="col-2 text-center">{{$t('AGsts' + i)}}</div>
          </div>
          <div class="row items-center font-mono justify-around">
            <div v-for="i in 5" :key="i" class="col-2 text-center">{{gr.sts[i]}}</div>
          </div>
        </div>
      </q-expansion-item>
    </div>

    <div  v-if="mesav">
      <div class="titre-lg full-width text-center tbs q-mt-lg q-pa-xs">
        {{$t('PGmesav', mesav.length)}}
      </div>
      
      <div v-if="mesav.length">
        <div v-for="(id, idx) of mesav" :key="id" class="q-my-sm">
          <apercu-membre :id="id" :idx="idx"/>
          <!--div>{{session.getCV(id).nom}}</div-->
          <q-separator v-if="idx < (sav.size - 1)" color="orange"/>
        </div>
      </div>
    </div>
  </div>

  <!-- Tab "membres" -------------------------------------------------->
  <div v-if="ui.pagetab==='membres' && gSt.egrC">
    <div v-if="amb">
      <div><btn-cond cond="cEdit" icon="check" :label="$t('PGrafcvs')" @ok="rafCvs"/></div>
      <div v-if="!nb" class="titre-lg text-italic">
        {{$t('PGnope')}}</div>
      <div v-if="nb && !lst.length" class="titre-lg text-italic">
        {{$t('PGnomb', [nb])}}</div>
      <div v-if="lst.length">
        <!--div v-for="e of lst" :key="e.id">{{e.nom}}</div-->
        <apercu-membre v-for="(e, idx) of lst" :key="e.id"
          class="q-my-lg" :id="e.id" :idx="idx"/>
      </div>
    </div>
    <div v-else class="titre-lg text-italic q-pa-sm">{{$t('PGnoamb')}}</div>
  </div>

  <!-- Gérer le mode simple / unanime -->
  <dial-std2 v-model="m3" :titre="$t('AGuna', [nomg])" help="dial_una">
    <div class="q-pa-sm">
      <div class="titre-lg text-center text-bold q-my-sm" v-if="gr.msu===null">{{$t('AGms')}}</div>
      <div class="titre-lg text-center text-bold q-my-sm" v-else>{{$t('AGmu')}}</div>
      <div class="titre-md q-my-sm">{{$t('AGu1')}}</div>
      <div class="titre-md q-my-sm">{{$t('AGu2')}}</div>
      <div class="titre-md q-mb-sm q-mt-lg" v-if="gr.msu">{{$t('AGu3')}}</div>
      <div class="titre-md q-mb-sm q-mt-lg" v-else>{{$t('AGu4')}}</div>
      <div v-if="gr.msu">
        <div class="spsm column items-center">
          <q-separator class="q-mt-md q-mb-sm full-width" color="orange"/>
          <div class="titre-md text-italic" >{{$t('AGu5')}}</div>
          <div v-for="(v, idx) in lstVotes" :key="idx" 
            :class="'row items-center justify-center ' + dkli(idx)" style="width:20rem">
            <div class="col-8 fs-md text-center">{{v.nom}}</div>
            <div class="col-4 fs-md">{{$t(v.oui ? 'oui' : 'non')}}</div>
          </div>
          <q-separator class="q-mb-md q-mt-sm full-width" color="orange"/>
        </div>
      </div>

      <div v-if="!estAnim && estAnim1" class="column items-center q-gutter-sm">
        <div class="titre-md text-center msg">{{$t('AGupasan')}}</div>
        <sel-avidgr :groupe="gr" anim/>
        <btn-cond :label="$t('jailu')" @ok="ui.fD"/>
      </div>

      <div v-if="!estAnim1" class="column items-center q-gutter-sm">
        <div class="titre-md text-center msg">{{$t('AGupasan2')}}</div>
        <btn-cond :label="$t('jailu')" @ok="ui.fD"/>
      </div>

      <div v-if="estAnim && estAnim1" class="column items-center q-gutter-sm">
        <btn-cond flat :label="$t('renoncer')" icon="undo" @ok="ui.fD"/>
        <btn-cond v-if="gr.msu" :label="$t('AGums')" color="warning" @ok="cfu = 1" cond="cEdit"/>
        <btn-cond v-if="gr.msu" :label="$t('AGrumu')" color="warning" @ok="cfu = 2" cond="cEdit"/>
        <btn-cond v-if="!gr.msu" :label="$t('AGumu')" color="warning" @ok="cfu = 2" cond="cEdit"/>
        <bouton-confirm :actif="cfu!==0 && estAnim" :confirmer="chgU"/>
      </div>
    </div>
  </dial-std2>

  <!-- Gérer l'hébergement, changer les quotas -->
  <dial-std2 v-model="m2" :titre="$t('AGgerh', [nomg])" help="dial_heb">
    <div class="q-pa-xs">
      <div v-if="hko" class="column q-mt-md items-center q-gutter-md">
        <div class="q-ma-sm msg">{{$t('AGhko')}}</div>
        <btn-cond v-if="!dejaHeb" :label="$t('jailu')" flat @ok="ui.fD"/>
      </div>

      <div v-if="!gr.dfh" class="row">
        <span class="titre-md q-mr-sm">{{$t('AGheb')}}</span>
        <span class="fs-md">{{nom(gr.imh)}}</span>
      </div>
      <div v-else class="q-my-sm msg">{{$t('AGcas1', [AMJ.editDeAmj(gr.dfh)])}}</div>
      <div v-if="gSt.egrC.estAnim" class="q-my-sm">{{$t('AGcas3')}}</div>
      <div v-if="dejaHeb" class="q-my-sm">{{$t('AGcas2')}}</div>
      <div v-if="gr.imh && !dejaHeb && actuelAnim" class="q-my-sm">{{$t('AGcas4')}}</div>

      <div v-if="!hko">
        <q-separator color="orange" class="q-mt-md"/>
        <div class="titre-lg q-my-sm text-italic">{{$t('AGselac')}}</div>
        <div class="column q-ml-md">
          <q-radio v-if="cas.has(1)"  v-model="action" :val="1" :label="$t('AGac1')" />
          <q-radio v-if="cas.has(2)"  v-model="action" :val="2" :label="$t('AGac2')" />
          <q-radio v-if="cas.has(3)"  v-model="action" :val="3" :label="$t('AGac3')" />
          <q-radio v-if="cas.has(4)"  v-model="action" :val="4" :label="$t('AGac4')" />
        </div>

        <div v-if="(action === 1 || action === 3) && options.length > 1" 
          class="spsm row justify-center q-my-sm bord">
          <div class="row items-center">
            <div class="titre-md q-mt-sm text-italic q-mr-md">{{$t('AGselav')}}</div>
            <q-select class="lgsel" v-model="nvHeb" :options="options"/>
          </div>
        </div>

        <div v-if="(action === 1 || action === 3) && nvHeb" class="q-my-sm text-italic text-center titre-lg text-bold">
          {{$t('AGselav2', [nvHeb.label])}}
        </div>

        <div v-if="action !== 0 && action !== 2" class="q-my-md">
          <choix-quotas class="q-my-sm" v-model="q" groupe/>
          <div v-if="q.err" class="q-ma-sm q-pa-xs msg titre-md">{{$t('AGmx')}}</div>
          <div v-else>
            <div v-if="aln || alv">
              <q-separator color="orange" class="q-my-xs"/>
              <div v-if="aln && gr.imh" class="msg q-pa-xs">{{$t('AGaln')}}</div>
              <div v-if="alv" class="msg q-pa-xs">{{$t('AGalv')}}</div>
              <q-separator color="orange" class="q-my-xs"/>
            </div>
          </div>
        </div>

        <div v-if="action !== 0 && action !== 2 && !q.err">
          <div v-if="aln" class="q-pa-xs q-ma-sm msg titre-md">{{$t('AGaln')}}</div>
          <div v-if="alv" class="q-pa-xs q-ma-sm msg titre-md">{{$t('AGalv')}}</div>
          <div v-if="!aln" :class="'q-pa-xs titre-md q-ma-sm ' + (arn ? 'msg' : '')">{{$t('AGdisp1', [rstn])}}</div>
          <div v-if="!alv" :class="'q-pa-xs titre-md q-ma-sm ' + (arv ? 'msg' : '')">{{$t('AGdisp2', [rstv])}}</div>
        </div>

        <div class="q-mt-md row justify-center items-center q-gutter-md">
          <btn-cond size="md" :label="$t('renoncer')" flat icon="undo" @ok="ui.fD"/>
          <bouton-confirm v-if="action === 2" actif :confirmer="chgQ"/>
          <bouton-confirm v-if="action === 4" 
            :actif="!q.err && !aln && !alv && (q.qn !== gr.qn || q.qv !== gr.qv)" :confirmer="chgQ"/>
          <bouton-confirm v-if="action === 1 || action === 3" 
            :actif="!q.err && !aln && !alv" :confirmer="chgQ"/>
        </div>
      </div>
    </div>
  </dial-std2>

  <dial-std2  v-model="m1" :titre="$t('CHGtit', [nomg])" help="chatgr">
    <apercu-chatgr />
  </dial-std2>

</q-page>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { UNITEN, UNITEV, AMJ } from '../app/api.mjs'
import { $t, bcf, dhcool, styp, dkli, edvol, afficher8000 } from '../app/util.mjs'
import BtnCond from '../components/BtnCond.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import ApercuMembre from '../components/ApercuMembre.vue'
import SelAvidgr from '../components/SelAvidgr.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import QuotasVols from '../components/QuotasVols.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import ApercuChatgr from '../panels/ApercuChatgr.vue'
import DialStd2 from '../dialogues/DialStd2.vue'
import { ModeSimple, RafraichirCvsGr, HebGroupe } from '../app/operations4.mjs'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const m1 = computed(() => ui.d[idc].ACGouvrir)
const m2 = computed(() => ui.d[idc].AGgererheb)
const m3 = computed(() => ui.d[idc].AGediterUna)

const session = stores.session
const gSt = stores.groupe

const cfu = ref(0)
const options = ref([])
const nvHeb = ref(0)
// AGhko: 'L\'hébergeur actuel étant animateur, je ne peux pas me substituer à lui aucun de mes avatars n\'est animateur.',
const hko = computed(() => !dejaHeb.value && !gSt.egrC.estAnim && actuelAnim.value)
const q = ref({})
const action = ref(0)
const aln = ref(false) 
const alv = ref(false) 
const arn = ref(false) 
const arv = ref(false) 
const rstn = ref(0) 
const rstv = ref(0)
const lstVotes = ref()
const cas = ref()
const restqn = ref(0)
const restqv = ref(0)

const nomg = computed(() => session.getCV(session.groupeId).nom)
const mesav = computed(() => { 
  const l = []
  const mav = session.compte.mav
  gr.value.tid.forEach(id => {if (mav.has(id)) l.push(id)})
  return l
})
const idg = computed(() => session.groupeId)
const sav = computed(() => session.compte.mpg.get(idg.value) || new Set())
const gr = computed(() => gSt.egrC ? gSt.egrC.groupe : null)

const dejaHeb = computed(() => gr.value.imh && sav.value.has(gr.value.tid[gr.value.imh]))
const idHebAc = computed(() => gr.value.imh ? gr.value.tid[gr.value.imh] : '')
const stHebAv = computed(() => gr.value.imh ? gr.value.st[gr.value.imh] : 0)
const actuelAnim = computed(() => stHebAv.value === 5)

const nbiv = computed(() => gr.value.nbInvites)
const amb = computed(() => gSt.ambano[0])
const lst = computed(() => pgLmFT.value.r)
const nb = computed(() => pgLmFT.value.n)
const vols = computed(() => { return { qn: gr.value.qn, qv: gr.value.qv, nn: gr.value.nn, v: gr.value.vf }})
const estAnim1 = computed(() => gSt.estAnim(session.groupeId))
const estAnim = computed(() => gr.value.estAnim(gr.value.mmb.get(session.avatarId)) )

const restn = computed(() => { const cpt = session.compte.qv; return (cpt.qn * (100 - cpt.pcn) / 100) })
const restv = computed(() => { const cpt = session.compte.qv; return (cpt.qv * (100 - cpt.pcv) / 100) })

/* PageGroupe - membres people **************************************************/
const pgLmFT = computed(() => {
  const f = stores.filtre.filtre.groupe
  const c = session.compte
  const r = []
  let n = 0
  const g = gSt.egrC ? gSt.egrC.groupe : null
  if (g) for (let im = 1; im < g.st.length; im++) {
    const stm = g.st[im]
    if (!stm) continue
    const idm = g.tid[im]
    if (!idm) continue
    if (c.mav.has(idm)) continue
    const mb = g.accesMembre(im)
    if (!mb && !estAnim1.value) continue
    n++
    const nom = session.getCV(idm).nomC
    if (f.nmb && !nom.startsWith(f.nmb)) continue
    if (f.stmb && stm !== f.stmb) continue
    if (f.ambno) {
      const no = g.accesNote(im)
      if (f.ambno === 1 && !(mb && !no)) continue
      if (f.ambno === 2 && !(no && !mb)) continue
      if (f.ambno === 3 && !(mb && no)) continue
      if (f.ambno === 4 && !(!mb && !no)) continue
      if (f.ambno === 5 && !g.accesEcrNote(im)) continue
    } 
    r.push({ id: idm, im, nom })
  }
  r.sort((a, b) => { return a.nom < b.nom ? -1 : (a.nom > b.nom ? 1 : 0) })
  return { r, n }
})

watch(pgLmFT, (ap) => { ui.fmsg(ap.r.length) })

const nom = (im) => {
  const id = gr.value.tid[im]
  return id ? session.getCV(id).nomC : $t('inconnu')
}

async function editUna () {
  cfu.value = 0
  lstVotes.value = []
  if (gr.value.msu) {
    for (let ids = 1; ids < gr.value.flags.length; ids++) {
      if (gr.value.st[ids] === 5)
        lstVotes.value.push({ nom: nom(ids), oui: gr.value.msu.indexOf(ids) !== -1 })
    }
  }
  ui.oD('AGediterUna', idc)
}

async function rafCvs () {
  let nc = 0, nv = 0
  const r = await new RafraichirCvsGr().run()
  if (typeof r ==='number') await afficher8000(r, 0, session.groupeId)
  else {
    const [x, y] = r
    nc += x; nv += y
    stores.ui.afficherMessage($t('CVraf2', [nc, nv]), false)
  }
}

async function chgU () {
  await new ModeSimple().run(cfu.value === 1)
  cfu.value = 0
  ui.fD()
}


function setCas () {
  /* Pour être / devenir hébergeur, il faut:
  - a) que le nn et vf actuels du groupe ne fasse pas excéder les quotas du compte
  Si l'hébergeur actuel est un autre compte animateur, 
  il faut être animateur pour prendre l'hébergment.
  */
  nvHeb.value = null
  action.value = 0
  cas.value = new Set()
  if (hko.value) return

  /* Liste des avatars du compte pouvant être hébergeur (sauf celui actuel):
    - options : [{ label, value, cv, im}] - mes avatars pouvant être hébergeur
    - nvHeb : nouvel hébergeur pré-sélectionné
  */
  options.value = []
  for (const id of sav.value) {
    const im = gr.value.mmb.get(id)
    if (im) {
      if (im === gr.value.imh) continue
      if (!dejaHeb.value && actuelAnim.value && gr.value.st[im] !== 5) continue
      const cv = session.getCV(id)
      options.value.push({ label: cv.nom, value: id, cv, im })
    }
  }
  if (options.value.length) nvHeb.value = options.value[0]

  if (dejaHeb.value) {
    // 2: 'Je PEUX cesse d\'héberger ce groupe',
    cas.value.add(2)
    // 3: 'Je PEUX transmettre l\'hébergement à un autre de mes avatars',
    if (options.value.length) cas.value.add(3) 
    // 4: 'Je PEUX mettre seulement à jour les nombres de notes et volumes de fichiers maximum attribués au groupe',
    cas.value.add(4)
  } else {
    // 1: 'Je PEUX prendre l\'hébergement à mon compte'
    if (!gr.value.imh || !actuelAnim.value || gSt.egrC.estAnim) cas.value.add(1)
  }
}

async function gererheb () {
  setCas()
  const cpt = session.compte.qv
  const cptn = cpt.nn + cpt.nc + cpt.ng
  restqn.value = Math.floor(((cpt.qn * UNITEN) - cptn) / UNITEN) + (dejaHeb.value ? gr.value.qn : 0)
  restqv.value =  Math.floor(((cpt.qv * UNITEV) - cpt.v) / UNITEV) + (dejaHeb.value ? gr.value.qv : 0)
  q.value.qn = gr.value.qn || 0
  q.value.qv = gr.value.qv || 0
  q.value.minn = 0
  q.value.minv = 0
  q.value.maxn = cpt.qn // restqn.value
  q.value.maxv = cpt.qv // restqv.value
  q.value.err = false
  onChgQ()
  ui.oD('AGgererheb', idc)
}

function onChgQ () {
  const cpt = session.compte.qv
  aln.value = gr.value.nn > (q.value.qn * UNITEN)
  alv.value = gr.value.vf > (q.value.qv * UNITEV)
  const rn = (restqn.value - q.value.qn) * UNITEN
  const rv = (restqv.value - q.value.qv) * UNITEV
  rstn.value = rn >= 0 ? rn : 0
  rstv.value = edvol(rv >=0 ? rv : 0)
  arn.value = rn < (cpt.qn * UNITEN * 0.1)
  arv.value = rv < (cpt.qv * UNITEV * 0.1)
}

async function chgQ () {
  if (action.value === 5) action.value = 1
  const nh = nvHeb.value ? nvHeb.value.value : idHebAc.value
  const r = await new HebGroupe().run(action.value, nh, q.value.qn, q.value.qv )
  if (r) await afficher8000(r, 0, session.groupeId, nvHeb.value.value)
  ui.fD()
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border: 1px solid var(--q-warning)
  border-radius: 5px !important
  padding: 3px
</style>
