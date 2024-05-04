<template>
<q-page>
  <!-- Tab "groupe" -------------------------------------------------->
  <div v-if="ui.pagetab==='groupe' && gSt.egrC" class="q-pa-sm spmd column justify-center">
    <div class="row q-mt-lg q-mb-md justify-around">
      <btn-cond icon="people" cond="cEdit"
        :label="$t('PGinvitation')" @ok="ui.setPage('invitation')"/>
      <btn-cond v-if="gSt.ambano[0]" icon="chat" :label="$t('PGchat')" cond="cVisu"
        @ok="this.ui.oD('ACGouvrir')"/>
    </div>

    <div>
      <apercu-genx :id="idg" :idx="0"/>

      <div v-if="gr.dfh" class="q-mr-sm">
        <q-icon name="warning" size="md" color="negative"/>
        <span class="q-ml-xs q-pa-xs bg-yellow-3 text-negative">{{$t('PGnh')}}</span>
      </div>

      <div class="q-mr-sm">
        <q-icon v-if="nbiv" class="q-mr-xs" name="star" size="md" color="green-5"/>
        <span class="text-italic">{{$t('PGinv', nbiv, {count: nbiv})}}</span>
      </div>

      <div v-if="!gr.estRadie(1)" class="q-mt-sm titre-md q-mr-sm">{{$t('AGfond', [nom(1)])}}</div>
      <div v-else class="q-mt-sm fs-md text-italic">{{$t('AGnfond')}}</div>

      <div class="q-mt-sm row justify-between">
        <div v-if="gr.msu" class="titre-md text-bold text-warning">{{$t('AGunanime')}}</div>
        <div v-else class="titre-md">{{$t('AGsimple')}}</div>
        <btn-cond class="col-auto q-ml-sm self-start" size="sm" :label="$t('details')"
          icon="edit" @ok="editUna" cond="cVisu"/>
      </div>

      <div :class="'q-mt-xs q-pa-xs ' + bcf()">
        <div class="row justify-between">
          <div v-if="!gr.dfh" class="row">
            <span class="titre-md q-mr-sm">{{$t('AGheb')}}</span>
            <span class="fs-md">{{nom(gr.imh)}}</span>
          </div>
          <div v-else class="col fs-md text-warning text-bold">{{$t('AGnheb', [dhcool(dfh)])}}</div>
          <btn-cond class="col-auto q-ml-sm self-start" size="sm" cond="cEdit"
            :label="$t('gerer')" icon="settings" @ok="gererheb"/>
        </div>
        <quotas-vols class="q-mt-xs q-ml-md" :vols="vols" groupe/>
      </div>

      <div class="titre-md text-italic q-mt-xs">{{$t('AGstm')}}</div>
      <div class="row spsm items-center titre-md text-italic">
        <div v-for="i in 5" :key="i" class="col-2 text-center">{{$t('AGsts' + i)}}</div>
      </div>
      <div class="row spsm items-center font-mono">
        <div v-for="i in 5" :key="i" class="col-2 text-center">{{gr.sts[i]}}</div>
      </div>
    </div>

    <div class="titre-lg full-width text-center text-white bg-secondary q-my-sm q-pa-xs">
      {{$t('PGmesav', sav.size)}}
    </div>
    
    <div v-if="sav.size">
      <div v-for="(id, idx) of sav" :key="id" class="q-mt-sm">
        <apercu-membre :id="id" :idx="idx"/>
        <!--div>{{session.getCV(id).nom}}</div-->
        <q-separator v-if="idx < (sav.size - 1)" color="orange"/>
      </div>
    </div>
  </div>

  <!-- Tab "membres" -------------------------------------------------->
  <div v-if="ui.pagetab==='membres' && gSt.egrC" class="q-pa-sm spmd">
    <div v-if="amb">
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
    <div v-else class="titre-lg text-italic">{{$t('PGnoamb')}}</div>
  </div>

<!-- Gérer le mode simple / unanime -->
  <q-dialog v-model="ui.d.AGediterUna[idc]" full-height position="left" persistent>
    <q-layout container view="hHh lpR fFf" :class="styp('md')">
      <q-header elevated class="bg-primary text-white">
        <q-toolbar>
          <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('AGuna', [nomg])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
      </q-header>

      <q-page-container>
        <q-page class="q-pa-sm">
          <sel-avid :groupe="gr"/>
          <div class="titre-lg text-center text-bold q-my-sm" v-if="gr.msu===null">{{$t('AGms')}}</div>
          <div class="titre-lg text-center text-bold q-my-sm" v-else>{{$t('AGmu')}}</div>
          <div class="titre-md q-my-sm">{{$t('AGu1')}}</div>
          <div class="titre-md q-my-sm">{{$t('AGu2')}}</div>
          <div class="titre-md q-my-sm" v-if="gr.msu">{{$t('AGu3')}}</div>
          <div class="titre-md q-my-sm" v-else>{{$t('AGu4')}}</div>
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
          <div v-if="!estAnim" class="row items-center q-gutter-sm">
            <div class="titre-md text-center">{{$t('AGupasan')}}</div>
            <btn-cond class="self-start" :label="$t('jailu')" @ok="ui.fD"/>
          </div>
          <div v-else class="column q-gutter-xs items-center">
            <btn-cond v-if="gr.msu" :label="$t('AGums')" color="warning" @ok="cfu = 1" cond="cEdit"/>
            <btn-cond v-if="gr.msu" :label="$t('AGrumu')" color="warning" @ok="cfu = 2" cond="cEdit"/>
            <!--q-btn v-if="!eg.groupe.msu" :label="$t('AGumu')" dense size="md" 
              color="warning" @click="cfu = 2"/-->
            <btn-cond v-if="!gr.msu" :label="$t('AGumu')" color="warning" @ok="cfu = 2" cond="cEdit"/>
            <div class="q-mt-md row justify-center items-center q-gutter-md">
              <btn-cond flat class="q-mrlg" :label="$t('renoncer')" @ok="ui.fD"/>
              <bouton-confirm :actif="cfu!==0 && estAnim" :confirmer="chgU"/>
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
          <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('AGgerh', [nomg])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
      </q-header>

      <q-page-container>
        <q-page class="q-pa-xs">
          <div class="titre-lg text-center q-ma-sm">
            <span v-if="cas===1">{{$t('AGcas1', [aaaammjj(gr.dfh)])}}</span>
            <span v-if="cas===2">{{$t('AGcas2')}}</span>
            <span v-if="cas===3">{{$t('AGcas3')}}</span>
          </div>

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
                  <div v-if="alqn && gr.imh" class="q-ma-sm q-pa-xs titre-md text-bold text-negative bg-yellow-3">{{$t('AGq1x')}}</div>
                  <div v-if="alqn" class="q-ma-sm q-pa-xs titre-md text-bold text-negative bg-yellow-3">{{$t('AGv1')}}</div>
                  <div v-if="alqv && gr.imh" class="q-ma-sm q-pa-xs titre-md text-bold text-negative bg-yellow-3">{{$t('AGq2x')}}</div>
                  <div v-if="alqv" class="q-ma-sm q-pa-xs titre-md text-bold text-negative bg-yellow-3">{{$t('AGv2')}}</div>
                  <q-separator color="orange" class="q-my-xs"/>
                </div>
              </div>
            </div>

            <div v-if="action!==0 && action!==2">
              <div v-if="aln" class="q-pa-xs q-ma-sm titre-md text-bold text-negative bg-yellow-3">{{$t('AGv1b')}}</div>
              <div v-if="alv" class="q-pa-xs q-ma-sm titre-md text-bold text-negative bg-yellow-3">{{$t('AGv2b')}}</div>
              <div :class="'q-pa-xs titre-md q-ma-sm ' + (arn ? 'text-negative text-bold bg-yellow-3' : '')">{{$t('AGdisp1', [rstn])}}</div>
              <div :class="'q-pa-xs titre-md q-ma-sm ' + (arv ? 'text-negative text-bold bg-yellow-3' : '')">{{$t('AGdisp2', [rstv])}}</div>
            </div>

            <div class="q-mt-md row justify-center items-center q-gutter-md">
              <btn-cond size="md" class="q-mr-lg" :label="$t('renoncer')" flat @ok="ui.fD"/>
              <bouton-confirm v-if="action === 2 || (action !== 0 && !q.err && !aln && !alv)" 
                actif :confirmer="chgQ"/>
            </div>

          </q-card>

        </q-page>
      </q-page-container>
    </q-layout>
  </q-dialog>
</q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import { UNITEN, UNITEV } from '../app/api.mjs'
import { bcf, dhcool, styp, dkli, edvol } from '../app/util.mjs'
import BtnCond from '../components/BtnCond.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import ApercuMembre from '../components/ApercuMembre.vue'
import SelAvid from '../components/SelAvid.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import QuotasVols from '../components/QuotasVols.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import { ModeSimple } from '../app/operations4.mjs'

export default {
  name: 'PageGroupe',

  components: { BoutonHelp, BtnCond, ApercuGenx, QuotasVols, ApercuMembre,
    SelAvid, BoutonConfirm, ChoixQuotas },

  computed: {
    nomg () { return this.session.getCV(this.session.groupeId).nom },
    idg () { return this.session.groupeId },
    sav () { return this.session.compte.mpg.get(this.idg) || new Set() },
    gr () { return this.gSt.egrC ? this.gSt.egrC.groupe : null },
    nbiv () { return this.gr.nbInvites },
    amb () { return this.gSt.ambano[0] },
    lst () { return this.gSt.pgLmFT[0] },
    nb () { return this.gSt.pgLmFT[1] },
    vols () { return { qn: this.gr.qn, qv: this.gr.qv, n: this.gr.nn, v: this.gr.vf }},
    estAnim () { return this.gr.estAnim(this.gr.mmb.get(this.session.avatarId)) },
    restn () { const cpt = this.session.compte.qv; return (cpt.qn * (100 - cpt.pcn) / 100) },
    restv () { const cpt = this.session.compte.qv; return (cpt.qv * (100 - cpt.pcv) / 100) },
  },

  methods: {
    nom (im) {
      const id = this.gr.tid[im]
      return id ? this.session.getCV(id).nomC : this.$t('inconnu')
    },

    async editUna () {
      this.cfu = 0
      this.lstVotes = []
      if (this.gr.msu) {
        for (let ids = 1; ids < this.gr.flags.length; ids++) {
          if (this.gr.st[ids] === 5)
            this.lstVotes.push({ nom: this.nom(ids), oui: this.gr.msu.indexOf(ids) !== -1 })
        }
      }
      this.ui.oD('AGediterUna', this.idc)
    },

    async chgU () {
      await new ModeSimple().run(this.cfu === 1)
      this.cfu = 0
      this.ui.fD()
    },

    setCas () {
      const c = this.session.compte

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
      const mesIm = new Set()
      let estAnim = false
      for (const id of c.mpg.get(this.gr.id)) {
        const im = this.gr.mmb.get(id)
        if (this.gr.st[im] === 5) estAnim = true
        mesIm.add(im)
        if (im === this.gr.imh) continue // celui actuel
        if (!this.gr.estActif(im)) continue
        const cv = this.session.getCV(id)
        this.options.push({ label: cv.nom, value: id, cv, im })
      }
      if (this.options.length) this.nvHeb = this.options[0]

      if (!this.gr.imh) {
        /* Cas 1 : il n'y a pas d'hébergeur. */
        this.cas = 1
        if (this.options.length === 0) this.hko = 1
        // Je peux prendre l'hébergement
        return
      }

      if (mesIm.has(this.gr.imh)) {
        this.cas = 2
        /* Cas 2 : je suis hébergeur
        - si options.length = 0 Je ne peux pas envisager un transfert sur un autre de mes avatars
        */
        return
      }

      /* cas 3 : il y a un hébergeur mais ce n'est pas un des avatars de mon compte */
      this.cas = 3
      if (this.options.length === 0) { this.hko = 4; return }
      if (this.gr.estAnim(this.gr.imh)) { this.hko = 2; return }
      if (!estAnim) this.hko = 3
      /* je peux remplacer l'animateur actuel */
    },

    async gererheb () {
      this.setCas()
      this.q.qn = this.gr.qn || 0
      this.q.qv = this.gr.qv || 0
      this.q.minn = 0
      this.q.minv = 0
      this.q.maxn = Math.floor(this.q.qn + this.restn)
      this.q.maxv = Math.floor(this.q.qv + this.restv)
      this.q.err = false
      this.onChgQ()
      this.ui.oD('AGgererheb', this.idc)
    },

    onChgQ () {
      const cpt = this.session.compte.qv
      this.aln = this.gr.nn > (this.q.qn * UNITEN)
      this.alv = this.gr.vf > (this.q.qv * UNITEV)
      const rn = (this.restn - this.q.qn) * UNITEN
      const rv = (this.restv - this.q.qv) * UNITEV
      this.rstn = rn >=0 ? rn : 0
      this.rstv = edvol(rv >=0 ? rv : 0)
      this.arn = rn < (cpt.qn * UNITEN * 0.1)
      this.arv = rv < (cpt.qv * UNITEV * 0.1)
    },

    async chgQ () {
      // action, groupe, imh, q1, q2
      const imh = this.nvHeb ? this.nvHeb.im : 0
      // await new HebGroupe().run(this.action, this.eg.groupe, imh, this.q.q1, this.q.q2 )
      this.ui.fD()
    },
  },

  data () {
    return {
      cfu: 0,
      options: [],
      nvHeb: 0,
      hko: 0,
      q: {},
      action: 0,
      aln: false, alv: false, arn: false, arv: false, rstn: 0, rstv: 0
    }
  },

  setup () {
    const ui = stores.ui
    const idc = ui.getIdc()
    return {
      bcf, dhcool, styp, dkli, edvol,
      ui, idc,
      session: stores.session,
      gSt: stores.groupe
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.top3
  margin-top: 3rem
</style>
