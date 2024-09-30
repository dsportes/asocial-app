<template>
<q-page>
  <!-- Tab "groupe" -------------------------------------------------->
  <div v-if="ui.pagetab==='groupe' && gSt.egrC" class="q-pa-sm spmd column justify-center">
    <div class="row q-mt-lg q-mb-md justify-around">
      <btn-cond icon="people" cond="cEdit"
        :label="$t('PGinvitation')" @ok="ui.setPage('invitation')"/>
      <btn-cond v-if="gSt.ambano[0]" icon="chat" :label="$t('PGchat')" cond="cVisu"
        @ok="this.ui.oD('ACGouvrir', idc)"/>
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
          <div v-else class="col fs-md text-warning text-bold">
            {{$t('AGnheb', [AMJ.editDeAmj(gr.dfh)])}}</div>
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

    <div  v-if="mesav">
      <div class="titre-lg full-width text-center text-white bg-secondary q-my-sm q-pa-xs">
        {{$t('PGmesav', mesav.length)}}
      </div>
      
      <div v-if="mesav.length">
        <div v-for="(id, idx) of mesav" :key="id" class="q-mt-sm">
          <apercu-membre :id="id" :idx="idx"/>
          <!--div>{{session.getCV(id).nom}}</div-->
          <q-separator v-if="idx < (sav.size - 1)" color="orange"/>
        </div>
      </div>
    </div>
  </div>

  <!-- Tab "membres" -------------------------------------------------->
  <div v-if="ui.pagetab==='membres' && gSt.egrC" class="q-pa-sm spmd">
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
    <div v-else class="titre-lg text-italic">{{$t('PGnoamb')}}</div>
  </div>

<!-- Gérer le mode simple / unanime -->
  <q-dialog v-model="ui.d[idc].AGediterUna" full-height position="left" persistent>
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
  <q-dialog v-model="ui.d[idc].AGgererheb" full-height position="left" persistent>
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
            <span v-if="cas===1">{{$t('AGcas1', [AMJ.editDeAmj(gr.dfh)])}}</span>
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
              <q-radio v-if="cas===2"  v-model="action" :val="2" :label="$t('AGac2')" />
              <q-radio v-if="cas===2"  v-model="action" :val="3" :label="$t('AGac3')" />
              <q-radio v-if="cas===3"  v-model="action" :val="5" :label="$t('AGac5')" />
            </div>

            <div v-if="(action === 1 || action === 3 || action === 5)" 
              :class="'spsm row justify-center q-my-sm' + (options.length > 1 ? ' bord' : '')">
              <div v-if="options.length > 1" class="row items-center">
                <div class="titre-md q-mt-sm text-italic q-mr-md">{{$t('AGselav')}}</div>
                <q-select class="lgsel" v-model="nvHeb" :options="options"/>
              </div>
              <div v-if="options.length === 1">{{$t('AGselav2', [nvHeb.label])}}</div>
            </div>

            <div v-if="action !== 0 && action !== 2">
              <choix-quotas class="q-my-sm" :quotas="q" @change="onChgQ" groupe/>
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
              <btn-cond size="md" class="q-mr-lg" :label="$t('renoncer')" flat @ok="ui.fD"/>
              <bouton-confirm v-if="action === 2 || (action !== 0 && !q.err && !aln && !alv)" 
                actif :confirmer="chgQ"/>
            </div>

          </q-card>

        </q-page>
      </q-page-container>
    </q-layout>
  </q-dialog>

  <q-dialog v-model="ui.d[idc].ACGouvrir" full-height position="left" persistent>
    <apercu-chatgr />
  </q-dialog>

</q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import { UNITEN, UNITEV, AMJ } from '../app/api.mjs'
import { bcf, dhcool, styp, dkli, edvol, afficher8000 } from '../app/util.mjs'
import BtnCond from '../components/BtnCond.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import ApercuMembre from '../components/ApercuMembre.vue'
import SelAvid from '../components/SelAvid.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import QuotasVols from '../components/QuotasVols.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import ApercuChatgr from '../panels/ApercuChatgr.vue'
import { ModeSimple, RafraichirCvsGr, HebGroupe } from '../app/operations4.mjs'

export default {
  name: 'PageGroupe',

  components: { ApercuChatgr, BoutonHelp, BtnCond, ApercuGenx, QuotasVols, ApercuMembre,
    SelAvid, BoutonConfirm, ChoixQuotas },

  computed: {
    nomg () { return this.session.getCV(this.session.groupeId).nom },
    mesav () { const l = []; const mav = this.session.compte.mav
      this.gr.tid.forEach(id => {if (mav.has(id)) l.push(id)})
      return l
    },
    idg () { return this.session.groupeId },
    sav () { return this.session.compte.mpg.get(this.idg) || new Set() },
    gr () { return this.gSt.egrC ? this.gSt.egrC.groupe : null },
    actuelAnim () { return this.gr.imh && this.gr.st[this.gr.imh] === 5 },
    dejaHeb () { return this.sav.has(this.gr.tid[this.gr.imh]) },
    nbiv () { return this.gr.nbInvites },
    amb () { return this.gSt.ambano[0] },
    lst () { return this.gSt.pgLmFT[0] },
    nb () { return this.gSt.pgLmFT[1] },
    vols () { return { qn: this.gr.qn, qv: this.gr.qv, nn: this.gr.nn, v: this.gr.vf }},
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

    async rafCvs () {
      let nc = 0, nv = 0
      const r = await new RafraichirCvsGr().run()
      if (typeof r ==='number') await afficher8000(r, 0, this.session.groupeId)
      else {
        const [x, y] = r
        nc += x; nv += y
        stores.ui.afficherMessage(this.$t('CVraf2', [nc, nv]), false)
      }
    },

    async chgU () {
      await new ModeSimple().run(this.cfu === 1)
      this.cfu = 0
      this.ui.fD()
    },

    setCas () {
      /* Pour être / devenir hébergeur, il faut:
      - a) que le nn et vf actuels du groupe ne fasse pas excéder les quotas du compte
      - b) que l'avatar choisi ait accès aux notes en écriture
      Si l'hébergeur actuel est animateur et un autre compte, il faut être animateur pour prendre l'hébergment.
      */
      this.actions = []
      this.nvHeb = null
      this.action = 0
      this.nbSubst = 0
      this.cas = 0
      this.hko = 0
      /*
      AGhko1: 'Je ne peux pas être hébergeur, aucun de mes avatars n\'a accès aux notes du groupe.',
      AGhko2: 'Je suis hébergeur, mais je ne peux pas transférer l\'hébergement à un autre de mes avatars, aucun n\'ayant accès aux notes du groupe',
      AGhko3: 'L\'hébergeur actuel étant animateur, je ne peux pas me substituer à lui aucun de mes avatars ayant accès aux notes du groupe n\'est animateur.',
      */

      /* Liste des avatars du compte pouvant être hébergeur (sauf celui actuel):
        - options : [{ label, value, cv, im}] - mes avatars pouvant être hébergeur
        - nvHeb : nouvel hébergeur pré-sélectionné
      */
      this.options = []
      for (const id of this.sav) {
        const im = this.gr.mmb.get(id)
        if (im) {
          if (im === this.gr.imh) continue
          if (this.gr.accesNote2(im) === 2) { // accès aux notes en écriture
            this.nbSubst++
            if (this.actuelAnim && !this.dejaHeb 
              && this.gr.st[im] !== 5) continue
            const cv = this.session.getCV(id)
            this.options.push({ label: cv.nom, value: id, cv, im })
          }
        }
      }
      if (this.options.length) this.nvHeb = this.options[0]
      if (this.nbSubst === 0) this.hko = 1

      if (!this.gr.imh) { // Cas 1 : il n'y a pas d'hébergeur.
        this.cas = 1
        return
      }

      if (this.dejaHeb) { // Cas 2 : je suis hébergeur
        this.cas = 2
        if (this.options.length === 0) this.hko = 2
        return
      }

      /* cas 3 : il y a un hébergeur mais ce n'est pas un des avatars de mon compte */
      this.cas = 3
      if (this.nbSubst !== 0 && this.options.length === 0) this.hko = 3
    },

    async gererheb () {
      this.setCas()
      const cpt = this.session.compte.qv
      this.restqn = Math.floor(((cpt.qn * UNITEN) * (100 - cpt.pcn) / 100) / UNITEN) + (this.dejaHeb ? this.gr.qn : 0)
      this.restqv =  Math.floor(((cpt.qv * UNITEV) * (100 - cpt.pcv) / 100) / UNITEV) + (this.dejaHeb ? this.gr.qv : 0)
      this.q.qn = this.gr.qn || 0
      this.q.qv = this.gr.qv || 0
      this.q.minn = 0
      this.q.minv = 0
      this.q.maxn = this.restqn
      this.q.maxv = this.restqv
      this.q.err = false
      this.onChgQ()
      this.ui.oD('AGgererheb', this.idc)
    },

    onChgQ () {
      const cpt = this.session.compte.qv
      this.aln = this.gr.nn > (this.q.qn * UNITEN)
      this.alv = this.gr.vf > (this.q.qv * UNITEV)
      const rn = (this.restqn - this.q.qn) * UNITEN
      const rv = (this.restqv - this.q.qv) * UNITEV
      this.rstn = rn >= 0 ? rn : 0
      this.rstv = edvol(rv >=0 ? rv : 0)
      this.arn = rn < (cpt.qn * UNITEN * 0.1)
      this.arv = rv < (cpt.qv * UNITEV * 0.1)
    },

    async chgQ () {
      if (this.action === 5) this.action = 1
      const r = await new HebGroupe().run(this.action, this.nvHeb.value, this.q.qn, this.q.qv )
      if (r) await afficher8000(r, 0, this.session.groupeId, this.nvHeb.value)
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
      bcf, dhcool, styp, dkli, edvol, AMJ,
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
.bord
  border: 3px solid $warning
  border-radius: 5px !important
  padding: 3px
</style>
