<template>
<div>
  <div v-if="!eg || !eg.objv || !eg.objv.vols" class="titre-lg text-italic q-ma-md">{{$t('PGdisp')}}</div>

  <div v-else :class="dkli(idx)">
    <!--div style="height:3rem"/-->
    <apercu-genx :na="eg.groupe.na" :cv="eg.groupe.cv" :idx="idx" :cvchangee="cvchangee"/>

    <div v-if="eg.groupe.dfh" class="q-mr-sm">
      <q-icon name="warning" size="md" color="negative"/>
      <span class="q-ml-xs q-pa-xs bg-yellow-3 text-negative">{{$t('PGnh')}}</span>
    </div>
    <div class="q-mr-sm">
      <q-icon v-if="nbiv(eg)" class="q-mr-xs" name="star" size="md" color="green-5"/>
      <span class="text-italic">{{$t('PGinv', nbiv(eg), {count: nbiv(eg)})}}</span>
    </div>

    <div v-if="fond">
      <span class="q-mt-sm titre-md q-mr-sm">{{$t('AGfond')}}</span>
      <bouton-membre :eg="eg" :im="1" lab btn/>
    </div>
    <div v-else class="q-mt-sm fs-md text-italic">{{$t('AGnfond')}}</div>

    <div class="q-mt-sm row justify-between">
      <div v-if="eg.groupe.msu" class="titre-md text-bold text-warning">{{$t('AGunanime')}}</div>
      <div v-else class="titre-md">{{$t('AGsimple')}}</div>
      <q-btn class="q-ml-sm" size="sm" :label="$t('details')" 
        icon="edit" dense color="primary" @click="editUna"/>
    </div>

    <div :class="'q-mt-xs q-pa-xs' + bcf">
      <div class="row justify-between">
        <div v-if="!eg.groupe.dfh" class="col fs-md">
          <span class="fs-md q-mr-sm">{{$t('AGheb')}}</span>
          <bouton-membre :eg="eg" :im="eg.groupe.imh" lab btn/>
        </div>
        <div v-else class="col fs-md text-warning text-bold">{{$t('AGnheb', [aaaammjj(dfh)])}}</div>
        <q-btn class="col-auto" dense size="sm" color="primary" :label="$t('gerer')"
          icon="settings" @click="gererh"/>
      </div>
      <div class="q-mt-xs">
        <quotas-vols2 :vols="eg.objv.vols"/>
      </div>
    </div>

    <!-- Mots clés du groupe -->
    <div class="row items-center q-mt-sm">
      <div class="titre-md q-mr-md">{{$t('AGmc')}}</div>
      <q-btn icon="open_in_new" size="sm" color="primary" @click="autmcledit"/>
    </div>

    <div v-if="eg.groupe.nbInvits !== 0" class="q-mt-sm fs-md text-bold text-warning">
      {{$t('AGinvits', [eg.groupe.nbInvits])}}
    </div>

    <div class="titre-lg full-width text-center text-white bg-secondary q-mt-lg q-mb-md q-pa-sm">
      {{$t('PGmesav', imIdGroupe.size)}}
    </div>
    <q-btn v-if="accesMembre" @click="dialctc"
      dense size="md" no-caps color="primary" icon="add" :label="$t('PGplus')"/>

    <div v-for="[id, im] of imIdGroupe" :key="im" class="q-mt-sm">
      <q-separator color="orange"/>
       <!-- mb peut être absent (pas accès aux membres) -->
      <apercu-membre :mb="mb(im)" :im="im" :idav="id" :eg="eg" :idx="idx" :mapmc="mapmc"/>
    </div>
  </div>

  <!-- Dialogue d'édition des mots clés du groupe -->
  <q-dialog v-model="mcledit" persistent>
    <mots-cles class="bs full-width" :duGroupe="eg.groupe.id" @ok="okmc" :titre="$t('AGmc')"
      :lecture="!eg.estAnim || !session.editable"/>
  </q-dialog>

  <!-- Gérer le mode simple / unanime -->
  <q-dialog v-model="editerUna" full-height persistent>
    <div class="bs" style="width:80vw">
    <q-layout container view="hHh lpR fFf" :class="dkli(0)">
      <q-header elevated class="bg-secondary text-white">
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
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
            <div class="largeur30 maauto column items-center">
              <q-separator class="q-my-sm full-width" color="orange"/>
              <div class="titre-md text-italic" >{{$t('AGu5')}}</div>
              <div v-for="(v, idx) in lstVotes" :key="idx" :class="'row ' + dkli(idx)">
                <div class="col-8 fs-md">{{v.nom}}</div>
                <div class="col-2"></div>
                <div class="col-2 fs-md">{{$t(v.oui ? 'oui' : 'non')}}</div>
              </div>
              <q-separator class="q-my-sm full-width" color="orange"/>
            </div>
          </div>
          <div v-if="!estAnim">
            <div class="titre-md text-center">{{$t('AGupasan')}}</div>
            <q-btn class="q-ml-md" dense size="md" color="primary" :label="$t('jailu')" @click="MD.fD"/>
          </div>
          <div v-else class="column q-gutter-xs items-center">
            <q-btn v-if="eg.groupe.msu" :label="$t('AGums')" dense size="md" 
              color="warning" @click="cfu = 1"/>
            <q-btn v-if="eg.groupe.msu" :label="$t('AGrumu')" dense size="md" 
              color="warning" @click="cfu = 2"/>
            <!--q-btn v-if="!eg.groupe.msu" :label="$t('AGumu')" dense size="md" 
              color="warning" @click="cfu = 2"/-->
            <q-btn v-if="!eg.groupe.msu" :label="$t('AGumu')" dense size="md" 
              color="warning" @click="cfu = 2"/>
            <div class="q-mt-md row justify-center items-center q-gutter-md">
              <q-btn size="md" class="btn2" dense :label="$t('renoncer')" 
                color="primary" @click="MD.fD"/>
              <bouton-confirm :actif="cfu!==0" :confirmer="chgU"/>
            </div>
          </div>
        </q-page>
      </q-page-container>
    </q-layout>
    </div>
  </q-dialog>

  <!-- Gérer l'hébergement, changer les quotas -->
  <q-dialog v-model="gererheb" full-height persistent>
    <div class="bs"  style="width:80vw">
    <q-layout container view="hHh lpR fFf" :class="dkli(0)">
      <q-header elevated class="bg-secondary text-white">
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
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
          <bouton-membre v-if="cas > 1" :eg="eg" :im="eg.groupe.imh" lab />

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

            <div class="row justify-center q-gutter-md">
              <q-btn size="md" dense :label="$t('renoncer')" color="primary" @click="MD.fD"/>
              <bouton-confirm v-if="action === 2 || (action !== 0 && !q.err && !al1 && !al2)" 
                actif :confirmer="chgQ"/>
            </div>

          </q-card>

        </q-page>
      </q-page-container>
    </q-layout>
    </div>
  </q-dialog>

  <!-- Dialogue d'ouverture de la page des contacts pour ajouter un contact -->
  <q-dialog v-model="nvctc" persistent>
    <q-card class="bs">
      <q-card-section v-if="options.length">
        <div class="titre-md text-italic">{{$t('AGmoi1')}}</div>
        <div class="row justify-around items-center q-my-sm">
          <q-select class="q-mb-md lgsel" v-model="moic" :options="options" :label="$t('AGmoi2')" />
          <q-btn color="primary" dense icon="check" :label="$t('AGmoi3')" class="btn2"
            @click="okctcmoi"/>
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
        <q-btn flat :label="$t('renoncer')" color="primary" @click="MD.fD"/>
        <q-btn flat :label="$t('continuer')" color="warning" @click="pagectc"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

</div>
</template>

<script>
import { ref, reactive, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuMembre from './ApercuMembre.vue'
import ApercuGenx from './ApercuGenx.vue'
import { edvol, dhcool, dkli, afficherDiag, aaaammjj } from '../app/util.mjs'
import { UNITEV1, UNITEV2, AMJ } from '../app/api.mjs'
import BoutonMembre from './BoutonMembre.vue'
import BoutonConfirm from './BoutonConfirm.vue'
import BoutonHelp from './BoutonHelp.vue'
import QuotasVols2 from './QuotasVols2.vue'
import ChoixQuotas from './ChoixQuotas.vue'
import MotsCles from './MotsCles.vue'
import { MD, getNg, Groupe } from '../app/modele.mjs'
import { MajCvGr, MotsclesGroupe, ModeSimple, HebGroupe, NouveauMembre } from '../app/operations.mjs'

export default {
  name: 'ApercuGroupe',

  props: { 
    eg: Object,
    idx: Number,
    mapmc: Object
  },

  components: { MotsCles, ChoixQuotas, BoutonConfirm, BoutonHelp, ApercuMembre, ApercuGenx, BoutonMembre, QuotasVols2 },

  computed: {
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

    // Map (idav, im) dans le groupe idg
    imIdGroupe () { 
      if (this.accesMembre)
        return this.aSt.compte.imIdGroupeMB(this.eg.groupe.id) 
      return this.aSt.compte.imIdGroupe(this.eg.groupe.id) 
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
      this.ovnvctc()
    },

    pagectc () {
      this.session.setGroupeId(this.eg.groupe.id)
      this.ui.egrplus = true
      MD.fD()
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
          MD.fD()
          return
        }
        await sleep(500)
      }
    },

    async cvchangee (res) { // CV du GROUPE !
      if (res && this.eg) {
        await new MajCvGr().run(this.eg.groupe, res.ph, res.info)
      }
    },
    
    async autmcledit () {
      if (!await this.session.edit()) return
      if (!this.eg.estAnim) {
        await afficherDiag(this.$t('PGanim'))
      } else this.ovmcledit()
    },

    async okmc (mmc) {
      MD.fD()
      if (mmc !== false) {
        await new MotsclesGroupe().run(mmc, this.eg.groupe.na)
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

    async gererh () {
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
      this.ovgererheb()
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
      if (!await this.session.edit()) { MD.fD(); return }
      // action, groupe, imh, q1, q2
      const imh = this.nvHeb ? this.nvHeb.im : 0
      await new HebGroupe().run(this.action, this.eg.groupe, imh, this.q.q1, this.q.q2 )
      MD.fD()
    },


    async editUna () {
      if (!await this.session.edit()) return
      // this.gSt.test1(this.eg)
      this.ovediterUna()
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
      if (!await this.session.edit())  { MD.fD(); return }
      const mb = this.gSt.membreDeId(this.eg, this.session.avatarId)
      const una = this.eg.groupe.msu != null
      let ids = -1
      if (this.cfu === 1) { // passer en mode simple
        if (una) ids = mb.ids // on est en unanime : je vote pour simple
      } else { // passer / rester en unanime
        ids = 0
      }
      if (ids !== -1) await new ModeSimple().run(this.eg.groupe.id, ids)
      MD.fD()
    }
  },

  setup (props) {
    const session = stores.session
    const ui = stores.ui
    const gSt = stores.groupe
    const aSt = stores.avatar

    const eg = toRef(props, 'eg')

    const photoDef = stores.config.iconGroupe
    const q = reactive({q1:0, q2:0, min1:0, min2:0, max1:0, max2:0, err:false })

    const mcledit = ref(false)
    function ovmcledit () { MD.oD(mcledit) }
    const nvctc = ref(false)
    function ovnvctc () { MD.oD(nvctc) }
    const editerUna = ref(false)
    function ovediterUna () { MD.oD(editerUna) }
    const gererheb = ref(false)
    function ovgererheb () { MD.oD(gererheb) }
    const ardedit = ref(false)
    function ovardedit () { MD.oD(ardedit) }

    return {
      MD, dkli, aaaammjj,
      mcledit, ovmcledit, nvctc, ovnvctc, editerUna, ovediterUna,
      gererheb, ovgererheb, ardedit, ovardedit,
      session,
      ui,
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
.borda
  border: 1px solid $grey-5
.bord
  border-top: 1px solid $grey-5
.bordb
  border-bottom: 1px solid $grey-5
.bord1
  border: 1px solid $grey-5
  border-radius: 5px
  padding: 3px
.nom
  max-height: 1.3rem
  overflow: hidden
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.btn1
  padding: 1px !important
  width: 1.5rem !important
.q-btn
  padding: 1px 5px !important
.btn2
  height: 1.5rem
.lgsel
  width: 10rem
</style>
