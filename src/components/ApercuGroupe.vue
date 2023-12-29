<template>
<div>
  <div v-if="!eg || !eg.objv || !eg.objv.vols" class="titre-lg text-italic q-ma-md">{{$t('PGdisp')}}</div>

  <div v-else :class="dkli(idx)">
    <apercu-genx :id="eg.groupe.id" :idx="idx"/>

    <div v-if="eg.groupe.dfh" class="q-mr-sm">
      <q-icon name="warning" size="md" color="negative"/>
      <span class="q-ml-xs q-pa-xs bg-yellow-3 text-negative">{{$t('PGnh')}}</span>
    </div>
    <div class="q-mr-sm">
      <q-icon v-if="nbiv(eg)" class="q-mr-xs" name="star" size="md" color="green-5"/>
      <span class="text-italic">{{$t('PGinv', nbiv(eg), {count: nbiv(eg)})}}</span>
    </div>

    <div class="q-mt-sm row justify-end">
      <q-btn size="sm" icon="chat" :label="$t('PGchat')" 
        color="primary" dense padding="xs" @click="this.ui.oD('ACGouvrir')"/>
    </div>

    <div v-if="fond">
      <span class="q-mt-sm titre-md q-mr-sm">{{$t('AGfond')}}</span>
      <bouton-membre :eg="eg" :im="1" btn/>
    </div>
    <div v-else class="q-mt-sm fs-md text-italic">{{$t('AGnfond')}}</div>

    <div class="q-mt-sm row justify-between">
      <div v-if="eg.groupe.msu" class="titre-md text-bold text-warning">{{$t('AGunanime')}}</div>
      <div v-else class="titre-md">{{$t('AGsimple')}}</div>
      <q-btn class="col-auto q-ml-sm self-start" size="sm" :label="$t('details')" padding="xs"
        icon="edit" dense color="primary" @click="editUna"/>
    </div>

    <div :class="'q-mt-xs q-pa-xs ' + bcf">
      <div class="row justify-between">
        <div v-if="!eg.groupe.dfh" class="col fs-md">
          <span class="fs-md q-mr-sm">{{$t('AGheb')}}</span>
          <bouton-membre :eg="eg" :im="eg.groupe.imh" btn/>
        </div>
        <div v-else class="col fs-md text-warning text-bold">{{$t('AGnheb', [aaaammjj(dfh)])}}</div>
        <q-btn class="col-auto q-ml-sm self-start" dense size="sm" color="primary" padding="xs"
          :label="$t('gerer')" icon="settings" @click="gererheb"/>
      </div>
      <quotas-vols class="q-mt-xs" :vols="eg.objv.vols"/>
    </div>

    <!-- Mots clés du groupe -->
    <div class="row items-center q-mt-sm justify-between">
      <div class="titre-md q-mr-md">{{$t('AGmc')}}</div>
      <q-btn class="self-start" icon="edit" size="md" color="primary" round padding="none"
        @click="ui.oD('MCmcledit')"/>
    </div>

    <div v-if="eg.groupe.nbInvits !== 0" class="q-mt-sm fs-md text-bold text-warning">
      {{$t('AGinvits', [eg.groupe.nbInvits])}}
    </div>

    <div class="titre-lg full-width text-center text-white bg-secondary q-mt-lg q-mb-md q-pa-sm">
      {{$t('PGmesav', imNaGroupe.size)}}
    </div>
    <q-btn v-if="accesMembre" @click="dialctc"
      dense size="md" no-caps color="primary" icon="add" :label="$t('PGplus')"/>

    <div v-for="[im, na] of imNaGroupe" :key="im" class="q-mt-sm">
      <q-separator color="orange"/>
       <!-- mb peut être absent (pas accès aux membres) -->
      <apercu-membre :mb="mb(im)" :im="im" :na="na" :eg="eg" :idx="idx" :mapmc="mapmc"/>
    </div>
  </div>

  <apercu-chatgr v-if="ui.d.ACGouvrir"/>

  <!-- Dialogue d'édition des mots clés du groupe -->
  <mots-cles v-if="ui.d.MCmcledit" :idg="eg.groupe.id"/>

  <!-- Gérer le mode simple / unanime -->
  <q-dialog v-model="ui.d.AGediterUna[idc]" full-height position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
      <q-header elevated class="bg-primary text-white">
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="chevron_left" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('AGuna', [eg.groupe.na.nom])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
      </q-header>

      <q-page-container>
        <q-page class="q-pa-sm">
          <div class="titre-lg text-center text-bold q-my-sm" v-if="eg.groupe.msu===null">{{$t('AGms')}}</div>
          <div class="titre-lg text-center text-bold q-my-sm" v-else>{{$t('AGmu')}}</div>
          <div class="titre-md q-my-sm">{{$t('AGu1')}}</div>
          <div class="titre-md q-my-sm">{{$t('AGu2')}}</div>
          <div class="titre-md q-my-sm" v-if="eg.groupe.msu">{{$t('AGu3')}}</div>
          <div class="titre-md q-my-sm" v-else>{{$t('AGu4')}}</div>
          <div v-if="eg.groupe.msu">
            <div class="spsm column items-center">
              <q-separator class="q-mt-md q-mb-sm full-width" color="orange"/>
              <div class="titre-md text-italic" >{{$t('AGu5')}}</div>
              <div v-for="(v, idx) in lstVotes" :key="idx" :class="'row ' + dkli(idx)">
                <div class="col-8 fs-md">{{v.nom}}</div>
                <div class="col-2"></div>
                <div class="col-2 fs-md">{{$t(v.oui ? 'oui' : 'non')}}</div>
              </div>
              <q-separator class="q-mb-md q-mt-sm full-width" color="orange"/>
            </div>
          </div>
          <div v-if="!estAnim" class="row items-center q-gutter-sm">
            <div class="titre-md text-center">{{$t('AGupasan')}}</div>
            <q-btn class="self-start" dense size="md" color="primary" padding="xs"
              :label="$t('jailu')" @click="ui.fD"/>
          </div>
          <div v-else class="column q-gutter-xs items-center">
            <q-btn v-if="eg.groupe.msu" :label="$t('AGums')" dense size="md" padding="xs"
              color="warning" @click="cfu = 1"/>
            <q-btn v-if="eg.groupe.msu" :label="$t('AGrumu')" dense size="md"  padding="xs"
              color="warning" @click="cfu = 2"/>
            <!--q-btn v-if="!eg.groupe.msu" :label="$t('AGumu')" dense size="md" 
              color="warning" @click="cfu = 2"/-->
            <q-btn v-if="!eg.groupe.msu" :label="$t('AGumu')" dense size="md"  padding="xs"
              color="warning" @click="cfu = 2"/>
            <div class="q-mt-md row justify-center items-center q-gutter-md">
              <q-btn size="md" class="self-start" dense :label="$t('renoncer')"  padding="xs" 
                color="primary" @click="ui.fD"/>
              <bouton-confirm :actif="cfu!==0" :confirmer="chgU"/>
            </div>
          </div>
        </q-page>
      </q-page-container>
    </q-layout>
  </q-dialog>

  <!-- Gérer l'hébergement, changer les quotas -->
  <q-dialog v-model="ui.d.AGgererheb[idc]" full-height position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
      <q-header elevated class="bg-secondary text-white">
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="chevron_left" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('AGgerh', [eg.groupe.na.nom])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
      </q-header>

      <q-page-container>
        <q-page class="q-pa-xs">
          <div class="titre-lg text-center q-ma-sm">
            <span v-if="cas===1">{{$t('AGcas1', [aaaammjj(dfh)])}}</span>
            <span v-if="cas===2">{{$t('AGcas2')}}</span>
            <span v-if="cas===3">{{$t('AGcas3')}}</span>
          </div>
          <bouton-membre v-if="cas > 1" :eg="eg" :im="eg.groupe.imh"/>

          <div v-if="hko" class="q-ma-sm q-pa-sm text-bold text-warning bg-yellow-3">
            {{$t('AGhko' + hko)}}
          </div>

          <q-card v-else>
            <q-separator color="orange" class="q-mt-md"/>
            <div class="titre-lg q-my-sm text-italic">{{$t('AGselac')}}</div>
            <div class="column q-ml-md">
              <q-radio v-if="cas===1"  v-model="action" :val="1" :label="$t('AGac1')" />
              <q-radio v-if="cas===2"  v-model="action" :val="4" :label="$t('AGac4')" />
              <q-radio v-if="cas===2 && options.length > 0"  v-model="action" :val="3" :label="$t('AGac3')" />
              <q-radio v-if="cas===2"  v-model="action" :val="2" :label="$t('AGac2')" />
              <q-radio v-if="cas===3"  v-model="action" :val="5" :label="$t('AGac5')" />
            </div>

            <div v-if="(action===1 || action===3 || action===5) && options.length > 0" class="row items-center">
              <div class="titre-md q-mt-sm text-italic q-mr-md">{{$t('AGselav')}}</div>
              <q-select class="lgsel" v-model="nvHeb" :options="options"/>
            </div>

            <div v-if="action !==0 && action !==2">
              <choix-quotas class="q-my-sm" :quotas="q" @change="onChgQ" groupe/>
              <div v-if="q.err" class="q-ma-sm q-pa-xs titre-md text-bold text-negative bg-yellow-3">{{$t('AGmx')}}</div>
              <div v-else>
                <div v-if="alq1 || alq2">
                  <q-separator color="orange" class="q-my-xs"/>
                  <div v-if="alq1 && eg.groupe.imh" class="q-ma-sm q-pa-xs titre-md text-bold text-negative bg-yellow-3">{{$t('AGq1x')}}</div>
                  <div v-if="alq1" class="q-ma-sm q-pa-xs titre-md text-bold text-negative bg-yellow-3">{{$t('AGv1')}}</div>
                  <div v-if="alq2 && eg.groupe.imh" class="q-ma-sm q-pa-xs titre-md text-bold text-negative bg-yellow-3">{{$t('AGq2x')}}</div>
                  <div v-if="alq2" class="q-ma-sm q-pa-xs titre-md text-bold text-negative bg-yellow-3">{{$t('AGv2')}}</div>
                  <q-separator color="orange" class="q-my-xs"/>
                </div>
              </div>
            </div>

            <div v-if="action!==0 && action!==2">
              <div v-if="al1" class="q-pa-xs q-ma-sm titre-md text-bold text-negative bg-yellow-3">{{$t('AGv1b')}}</div>
              <div v-if="al2" class="q-pa-xs q-ma-sm titre-md text-bold text-negative bg-yellow-3">{{$t('AGv2b')}}</div>
              <div :class="'q-pa-xs titre-md q-ma-sm ' + (ar1 ? 'text-negative text-bold bg-yellow-3' : '')">{{$t('AGdisp1', [rst1])}}</div>
              <div :class="'q-pa-xs titre-md q-ma-sm ' + (ar2 ? 'text-negative text-bold bg-yellow-3' : '')">{{$t('AGdisp2', [rst2])}}</div>
            </div>

            <div class="q-mt-md row justify-center items-center q-gutter-md">
              <q-btn size="md" class="self-start" dense :label="$t('renoncer')"  padding="xs" 
                color="primary" @click="ui.fD"/>
              <bouton-confirm v-if="action === 2 || (action !== 0 && !q.err && !al1 && !al2)" 
                actif :confirmer="chgQ"/>
            </div>

          </q-card>

        </q-page>
      </q-page-container>
    </q-layout>
  </q-dialog>

  <!-- Dialogue d'ouverture de la page des contacts pour ajouter un contact -->
  <q-dialog v-model="ui.d.AGnvctc[idc]" persistent>
    <q-card :class="styp('sm')">
      <q-card-section v-if="options.length">
        <div class="titre-md text-italic">{{$t('AGmoi1')}}</div>
        <div class="row justify-around items-center q-my-sm">
          <q-select class="q-mb-md lgsel" v-model="moic" :options="options" :label="$t('AGmoi2')" />
          <q-btn color="primary" dense icon="check" :label="$t('AGmoi3')" 
            padding="xs" @click="okctcmoi"/>
        </div>
      </q-card-section>

      <q-card-section class="column q-ma-xs q-pa-xs titre-md">
        <div>{{$t('PGplus1')}}</div>
        <div class="q-ml-md">{{$t('PGplus2')}}</div>
        <div class="q-ml-md">{{$t('PGplus3')}}</div>
        <div class="q-ml-md">{{$t('PGplus4')}}</div>
        <div class="q-ml-lg q-px-xs text-bold bord1">{{$t('PGplus5', [eg.groupe.na.nom])}}</div>
      </q-card-section>

      <q-card-actions vertical>
        <q-btn flat :label="$t('renoncer')" color="primary" @click="ui.fD"/>
        <q-btn flat :label="$t('continuer')" color="warning" @click="pagectc"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

</div>
</template>

<script>
import { ref, reactive } from 'vue'
import stores from '../stores/stores.mjs'
import { getNg, Groupe } from '../app/modele.mjs'
import { ModeSimple, HebGroupe, NouveauMembre } from '../app/operations.mjs'
import { styp, edvol, dhcool, dkli, afficherDiag, aaaammjj } from '../app/util.mjs'
import { UNITEV1, UNITEV2, AMJ } from '../app/api.mjs'

// Niveau 1
import BoutonMembre from './BoutonMembre.vue'
import BoutonConfirm from './BoutonConfirm.vue'
import BoutonHelp from './BoutonHelp.vue'
import QuotasVols from './QuotasVols.vue'
import ChoixQuotas from './ChoixQuotas.vue'

// Niveau 2
import MotsCles from '../dialogues/MotsCles.vue'

// Niveau 5
import ApercuGenx from './ApercuGenx.vue'

// Niveau 7
import ApercuMembre from './ApercuMembre.vue'

import ApercuChatgr from '../panels/ApercuChatgr.vue'

export default {
  name: 'ApercuGroupe',

  props: { 
    eg: Object,
    idx: Number,
    mapmc: Object
  },

  components: { MotsCles, ChoixQuotas, BoutonConfirm, BoutonHelp, ApercuMembre, 
  ApercuGenx, BoutonMembre, QuotasVols, ApercuChatgr },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    bcf () { return this.$q.dark.isActive ? ' bordfonce' : ' bordclair' },

    dfh () { return dhcool(AMJ.tDeAmjUtc(this.eg.groupe.dfh)) },
    fond () {
      if (this.eg.groupe.estDisparu(1)) return ''
      const m = this.eg.membres.get(1)
      if (!m) return ''
      return m.na.nomc + (m.estAC ? ' [' + $t('moi') + ']': '')
    },
    q1 () { const v = this.eg.groupe.vols; return v.q1 + ' - ' + edvol(v.q1 * UNITEV1) },
    q2 () { const v = this.eg.groupe.vols; return v.q2 + ' - ' + edvol(v.q2 * UNITEV2) },
    
    // nbv () { let n = 0; this.eg.membres.forEach(m => { if (m.vote) n++ }); return n }
    lstAn () {
      const t = []; this.anims.forEach(id => { t.push(getNg(id).nom)})
      return t.join(', ')
    },
    alq1 () { return !this.eg.groupe.imh || (this.eg.objv.v1 > (this.eg.objv.q1 * UNITEV1)) },
    alq2 () { return !this.eg.groupe.imh || (this.eg.objv.v2 > (this.eg.objv.q2 * UNITEV2)) },
    moi () { return getNg(this.session.avatarId).nom },
    hbg () { return this.eg.membres.get(this.eg.groupe.imh).na.nom },

    accesMembre () {
      const m = this.aSt.compte.imIdGroupe(this.eg.groupe.id)
      for (const [id, im] of m) if (this.eg.groupe.accesMembre(im)) return true 
      return false
    },

    imNaGroupe () { // Map cle:im valeur: na 
      let m
      if (this.accesMembre)
        m = this.aSt.compte.imNaGroupeMB(this.eg.groupe.id) 
      else 
        m = this.aSt.compte.imNaGroupe(this.eg.groupe.id, true)
      return m
    }
  },

  data () { return {
    /* Cas 
    - 1 : il n'y a pas d'hébergeur.
    - 2 : je suis hébergeur
    - 3 : il y a un hébergeur mais ce n'est pas moi */
    cas: 0,
    hko: 0, // erreur sur dialogue d'hébergement
    options: [], // [{ label, value, na, im}] - mes avatars pouvant être hébergeur
    actions: [], // les 5 actions possibles
    action: 0,
    nvHeb: null, // nouvel hébergeur pré-sélectionné

    al1: false,
    al2: false,
    rst1: 'OB',
    rst2: 'OB',
    ar1: false,
    ar2: false,

    imc: 0,
    anims: new Set(), // set des Ids des animateurs du groupe
    estAnim: false, // l'avatar courant est animateur du groupe
    monMb: null, // membre de l'avatar courant dans le groupe
    step: 0,
    lstVotes: [],
    moic: null,
    cfu: 0 // Choix de changement de mode non confirmé
  }},

  methods: {
    mb (im) { 
      const r = this.eg.membres.get(im)
      return r
    },

    nbiv (e) { return this.gSt.nbMesInvits(e) },
    // ast (m) { return this.eg.groupe.ast[m.ids] },

    async dialctc (na) {
      if (!await this.session.edit()) return
      this.options.length = 0
      const mois = this.aSt.compte.lstAvatarNas
      for (const nam of mois) {
        const m = this.gSt.membreDeId(this.eg, nam.id)
        if (!m) this.options.push({ value: nam.id, label: nam.nom, na: nam })
      }
      if (this.options.length) this.moic = this.options[0]
      this.ui.oD('AGnvctc', this.idc)
    },

    pagectc () {
      this.session.setGroupeId(this.eg.groupe.id)
      this.ui.egrplus = true
      this.ui.fD()
      this.ui.setPage('people')
    },

    async okctcmoi () {
      while (true) {
        const nax = this.moic.na
        const gr = this.eg.groupe
        const nag = await Groupe.getNag(gr.na, nax)
        if (gr.enLNA(0, nag)) {
          await afficherDiag(this.$t('PPlna'))
          return
        }
        if (gr.enLNC(0, nag)) {
          await afficherDiag(this.$t('PPlnc'))
          return
        }
        const [nouveau, slot] = await gr.slot(nax)
        if (!nouveau) { // ça ne devrait pas se produire ici
          await afficherDiag(this.$t('PPctc'))
          return
        }
        const cv = this.aSt.getAvatar(nax.id).cv
        if (await new NouveauMembre().run(gr, slot, nax, cv)) {
          this.session.setMembreId(slot)
          this.ui.fD()
          return
        }
        await sleep(500)
      }
    },

    async setCas () {
      const session = stores.session
      const g = this.eg.groupe
      const c = this.aSt.compte

      this.actions = []
      this.action = 0
      this.hko = 0
      this.cas = 0
      this.nvHeb = null

      /* Liste des (autres) avatars du compte pouvant être hébergeur
        - options : [{ label, value, na, im}] - mes avatars pouvant être hébergeur
        - nvHeb : nouvel hébergeur pré-sélectionné
      */
      this.options = []
      for (const [id, im] of c.imIdGroupe(g.id)) {
        if (im === g.imh) continue // celui actuel
        if (!g.estActif(im)) continue
        const na = getNg(id)
        this.options.push({ label: na.nom, value: id, na: na, im: im})
      }
      if (this.options.length) this.nvHeb = this.options[0]

      if (!g.idh) {
        /* Cas 1 : il n'y a pas d'hébergeur. */
        this.cas = 1
        if (this.options.length === 0) this.hko = 1
        // Je peux prendre l'hébergement
        return
      }

      if (g.idh === session.compteId) {
        this.cas = 2
        /* Cas 2 : je suis hébergeur
        - si options.length = 0 Je ne peux pas envisager un transfert sur un autre de mes avatars
        */
        return
      }

      /* cas 3 : il y a un hébergeur mais ce n'est pas moi */
      this.cas = 3
      if (this.options.length === 0) { this.hko = 4; return }
      if (g.estAnim(g.imh)) { this.hko = 2; return }
      if (!this.eg.estAnim) this.hko = 3
      /* je peux remplacer l'animateur actuel */
    },

    async gererheb () {
      if (!await this.session.edit()) return
      this.setCas()
      const vx = this.eg.objv.vols
      const cpt = this.aSt.compta.compteurs.qv
      this.q.q1 = vx.q1 || 0
      this.q.q2 = vx.q2 || 0
      this.q.min1 = 0
      this.q.min2 = 0
      this.q.max1 = cpt.q1 - Math.ceil((cpt.nn + cpt.nc + cpt.ng) / UNITEV1)
      this.q.max2 = cpt.q2 - Math.ceil(cpt.v2 / UNITEV2)
      this.q.err = false
      this.onChgQ()
      this.ui.oD('AGgererheb', this.idc)
    },
    onChgQ () {
      const cpt = this.aSt.compta.compteurs.qv
      const vx = this.eg.objv.vols
      this.al1 = vx.v1 > (this.q.q1 * UNITEV1)
      this.al2 = vx.v2 > (this.q.q2 * UNITEV2)
      const r1 = (cpt.q1 - Math.ceil((cpt.nn + cpt.nc + cpt.ng) / UNITEV1) - this.q.q1) * UNITEV1
      const r2 = (cpt.q2 - Math.ceil(cpt.v2 / UNITEV2) - this.q.q2) * UNITEV2
      this.rst1 = r1 >=0 ? r1 : 0
      this.rst2 = edvol(r2 >=0 ? r2 : 0)
      this.ar1 = r1 < (cpt.q1 * UNITEV1 * 0.1)
      this.ar2 = r2 < (cpt.q2 * UNITEV2 * 0.1)
    },

    async chgQ () {
      if (!await this.session.edit()) { this.ui.fD(); return }
      // action, groupe, imh, q1, q2
      const imh = this.nvHeb ? this.nvHeb.im : 0
      await new HebGroupe().run(this.action, this.eg.groupe, imh, this.q.q1, this.q.q2 )
      this.ui.fD()
    },

    async editUna () {
      if (!await this.session.edit()) return
      // this.gSt.test1(this.eg)
      this.ui.oD('AGediterUna', this.idc)
      this.anims = this.gSt.animIds(this.eg)
      this.estAnim = this.anims.has(this.session.avatarId)
      this.lstVotes = []
      const g = this.eg.groupe
      if (g.msu) {
        for (let ids = 1; ids < g.flags.length; ids++) {
          if (g.estAnim(ids)) {
            const oui = g.msu.indexOf(ids) !== -1
            const nom = this.eg.membres.get(ids).na.nom
            this.lstVotes.push({ nom, oui })
          }
        }
      }
    },

    async chgU () {
      if (!await this.session.edit())  { this.ui.fD(); return }
      const mb = this.gSt.membreDeId(this.eg, this.session.avatarId)
      const una = this.eg.groupe.msu != null
      let ids = -1
      if (this.cfu === 1) { // passer en mode simple
        if (una) ids = mb.ids // on est en unanime : je vote pour simple
      } else { // passer / rester en unanime
        ids = 0
      }
      if (ids !== -1) await new ModeSimple().run(this.eg.groupe.id, ids)
      this.cfu = 0
      this.ui.fD()
    }
  },

  setup (props) {
    const session = stores.session
    const ui = stores.ui
    const idc = ref(ui.getIdc())
    const gSt = stores.groupe
    const aSt = stores.avatar

    //const eg = toRef(props, 'eg')

    const photoDef = stores.config.iconGroupe
    const q = reactive({q1:0, q2:0, min1:0, min2:0, max1:0, max2:0, err:false })

    return {
      styp, dkli, aaaammjj,
      session, ui, idc,
      photoDef,
      gSt,
      aSt,
      q
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 1px solid $grey-5
  border-radius: 5px
  padding: 3px
.lgsel
  width: 10rem
</style>
